import { EntityRepository, Loaded, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from '@node-rs/argon2';
import { TokenExpiredError } from 'jsonwebtoken';
import { User } from '../../users/entities';
import { UsersService } from '../../users/users.service';
import { AccessToken, RefreshToken } from './entities';
import { ConfigService } from '@nestjs/config';
import {
    JwtInsertPayload,
    JwtSignPayload,
    ResolvedToken,
    TokenType,
} from './types';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthorizationService } from '../authorization/authorization.service';
import { EmailsService } from '../../users/emails/emails.service';
import { EmailType } from '../../users/emails/constants';
import { getEntity } from '../../config/mikro-orm.config';

@Injectable()
export class AuthenticationService {
    private tokenProperties = {
        accessToken: {
            name: 'Access token',
            repository: this.accessTokensRepository,
            secret: this.config.get('auth.atKey'),
        },
        refreshToken: {
            name: 'Refresh token',
            repository: this.refreshTokensRepository,
            secret: this.config.get('auth.rtKey'),
        },
    };

    constructor(
        private readonly config: ConfigService,
        private usersService: UsersService,
        private emailsService: EmailsService,
        private jwtService: JwtService,
        private authorizationService: AuthorizationService,
        @InjectRepository(AccessToken)
        private accessTokensRepository: EntityRepository<AccessToken>,
        @InjectRepository(RefreshToken)
        private refreshTokensRepository: EntityRepository<RefreshToken>,
    ) {}

    static hashPassword(password: string) {
        return argon2.hash(password);
    }

    async validateUser(username: string, pass: string) {
        const user = await this.usersService.findOne({ username });
        if (user) {
            const { password } = user as User;
            const match = await argon2.verify(password, pass);
            if (match) {
                return user;
            }
        }
        return null;
    }

    calculateExpiration(ttlSeconds: number) {
        const expiration = new Date();
        expiration.setTime(expiration.getTime() + ttlSeconds * 1000);

        return expiration;
    }

    async createToken(
        type: TokenType,
        user: Pick<User, 'id'>,
        expiration: Date,
        rtOfAt?: RefreshToken,
    ) {
        const tokenRepository = this.tokenProperties[type].repository;
        const payload: JwtInsertPayload = {
            user,
            expiresAt: expiration,
        };

        if (type === 'accessToken') {
            payload.refreshToken = rtOfAt;
        }

        const token = tokenRepository.create(payload);
        await tokenRepository.persistAndFlush(token);

        return token;
    }

    createAccessToken(
        user: Pick<User, 'id'>,
        expiration: Date,
        refreshToken: RefreshToken,
    ) {
        return this.createToken('accessToken', user, expiration, refreshToken);
    }

    createRefreshToken(user: Pick<User, 'id'>, expiration: Date) {
        return this.createToken('refreshToken', user, expiration);
    }

    async generateToken(
        type: TokenType,
        user: Pick<User, 'id'>,
        expiresIn: number,
        oldTokenOrRtOfAt: RefreshToken,
    ) {
        const sub = User.encodeToHashedId(user.id);
        const expiresAt = this.calculateExpiration(expiresIn);
        const tokenSecret = this.tokenProperties[type].secret;

        let token: RefreshToken | AccessToken;
        if (type === 'refreshToken' && oldTokenOrRtOfAt) {
            token = await this.extendRefreshToken(oldTokenOrRtOfAt, expiresAt);
        } else {
            token = await this.createToken(
                type,
                user,
                expiresAt,
                oldTokenOrRtOfAt,
            );
        }

        const hashedTokenId = token.hashid();
        const payload: JwtSignPayload = {
            sub,
            jwtId: hashedTokenId,
        };

        if (type === 'refreshToken') {
            payload.consumes = (token as RefreshToken).consumes;
        }

        const encoded = await this.jwtService.signAsync(payload, {
            expiresIn,
            secret: tokenSecret,
        });

        return { token, encoded, decoded: payload };
    }

    generateAccessToken(
        user: Pick<User, 'id'>,
        expiresIn: number,
        refreshToken: RefreshToken,
    ) {
        return this.generateToken('accessToken', user, expiresIn, refreshToken);
    }

    generateRefreshToken(
        user: Pick<User, 'id'>,
        expiresIn: number,
        oldToken?: RefreshToken,
    ) {
        return this.generateToken('refreshToken', user, expiresIn, oldToken);
    }

    async extendRefreshToken(token: RefreshToken, expiration: Date) {
        const refreshToken = wrap(token).assign(
            {
                expiresAt: expiration,
                consumes: token.consumes + 1,
                accessTokens: {
                    revoked: true,
                },
            },
            {
                updateNestedEntities: true,
            },
        );

        const accessTokens = await refreshToken.accessTokens.loadItems();
        accessTokens.map((accessToken) => {
            accessToken.revoked = true;
        });

        await this.refreshTokensRepository.persistAndFlush(refreshToken);

        return token;
    }

    async resolveToken(
        type: TokenType,
        encodedOrResolved: string | ResolvedToken,
    ) {
        if (typeof encodedOrResolved !== 'string') return encodedOrResolved;

        const tokenProperties = this.tokenProperties[type];
        const tokenName = tokenProperties.name;
        const tokenRepository = tokenProperties.repository;
        const tokenEntity = getEntity(
            type === 'accessToken' ? 'AccessToken' : 'RefreshToken',
        ) as unknown as AccessToken | RefreshToken;
        const tokenSecret = tokenProperties.secret;

        try {
            const payload = await this.jwtService.verify(encodedOrResolved, {
                secret: tokenSecret,
            });

            if (!payload.sub || !payload.jwtId) {
                throw new UnprocessableEntityException(
                    tokenName + ' malformed',
                );
            }

            const jwtId = tokenEntity.decodeHashedId(
                payload.jwtId,
            ) as unknown as number;
            const token = await tokenRepository.findOne({
                id: jwtId,
            });

            if (!token) {
                throw new UnprocessableEntityException(
                    tokenName + ' not found',
                );
            }

            if (token.revoked) {
                throw new UnprocessableEntityException(tokenName + ' revoked');
            }

            if (
                type === 'refreshToken' &&
                payload.consumes !==
                    (token as Loaded<RefreshToken, never>).consumes
            ) {
                throw new UnprocessableEntityException(
                    tokenName + ' already consumed',
                );
            }

            const userId = User.decodeHashedId(
                payload.sub,
            ) as unknown as number;
            const user = await this.usersService.findOne({ id: userId });

            if (!user) {
                throw new UnprocessableEntityException(
                    tokenName + ' malformed',
                );
            }

            return {
                user,
                token,
                encoded: encodedOrResolved,
                decoded: payload,
            };
        } catch (e) {
            if (e instanceof TokenExpiredError) {
                throw new UnprocessableEntityException(tokenName + ' expired');
            } else {
                throw e;
            }
        }
    }

    resolveAccessToken(encodedOrResolved: string | ResolvedToken) {
        return this.resolveToken('accessToken', encodedOrResolved);
    }

    resolveRefreshToken(encodedOrResolved: string | ResolvedToken) {
        return this.resolveToken('refreshToken', encodedOrResolved);
    }

    async revokeToken(
        type: TokenType,
        encodedOrResolvedOrToken:
            | string
            | ResolvedToken
            | AccessToken
            | RefreshToken,
    ) {
        const tokenRepository = this.tokenProperties[type].repository;

        let payload: {
            token: Loaded<AccessToken, never> | Loaded<RefreshToken, never>;
            decoded?: any;
            user: Loaded<User, never>;
        };

        if (
            encodedOrResolvedOrToken instanceof AccessToken ||
            encodedOrResolvedOrToken instanceof RefreshToken
        ) {
            await wrap(encodedOrResolvedOrToken.user).init();
            payload = {
                token: encodedOrResolvedOrToken,
                user: encodedOrResolvedOrToken.user,
            };
        } else {
            payload = await this.resolveToken(
                type,
                encodedOrResolvedOrToken as string | ResolvedToken,
            );
        }

        const token = payload.token;
        token.revoked = true;
        await tokenRepository.persistAndFlush(token);

        return payload;
    }

    revokeAccessToken(
        encodedOrResolvedOrToken:
            | string
            | ResolvedToken
            | AccessToken
            | RefreshToken,
    ) {
        return this.revokeToken('accessToken', encodedOrResolvedOrToken);
    }

    revokeRefreshToken(
        encodedOrResolvedOrToken:
            | string
            | ResolvedToken
            | AccessToken
            | RefreshToken,
    ) {
        return this.revokeToken('refreshToken', encodedOrResolvedOrToken);
    }

    async createAccessTokenFromRefreshToken(
        encodedOrResolvedRefresh: string | ResolvedToken,
        expiresIn: number,
    ) {
        const { user, token } = await this.resolveRefreshToken(
            encodedOrResolvedRefresh,
        );

        const refreshToken = await this.generateRefreshToken(
            user,
            this.config.get('auth.rtExpiresIn'),
            token as Loaded<RefreshToken, never>,
        );

        const accessToken = await this.generateAccessToken(
            user,
            expiresIn,
            token as Loaded<RefreshToken, never>,
        );

        return { user, accessToken, refreshToken };
    }

    async logout(encodedOrResolvedAuth: string | ResolvedToken) {
        const { token: accessToken } = await this.resolveAccessToken(
            encodedOrResolvedAuth,
        );

        const refreshToken = await wrap(
            (accessToken as Loaded<AccessToken, never>).refreshToken,
        ).init();

        const resolvedAccessToken = await this.revokeAccessToken(
            encodedOrResolvedAuth,
        );
        const resolvedRefreshToken = await this.revokeRefreshToken(
            refreshToken,
        );

        const payload = {
            accessToken: resolvedAccessToken,
            refreshToken: resolvedRefreshToken,
        };

        return payload;
    }

    async register(username: string, password: string, emailAddress: string,firstName: string,lastName: string) {
        await this.usersService.checkDuplicates(username);
        await this.emailsService.checkDuplicates(emailAddress);

        const hashed = await AuthenticationService.hashPassword(password);

        console.log(firstName,lastName,"register")

        const user = await this.usersService.create({
            username,
            password: hashed,
            firstName,
            lastName
        });
        user.firstName = firstName;
        user.lastName = lastName;

        await this.emailsService.create(
            {
                user,
                address: emailAddress,
                type: EmailType.Primary,
            },
            true,
        );

        return user;
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async clearOldTokens() {
        const now = new Date();
        const accessTokenExpiresIn: number =
            this.config.get('auth.atExpiresIn');
        const accessTokenGetsRevokedIn: number = accessTokenExpiresIn * 2;
        const expiredAccessTokenDate = new Date(
            now.getTime() - accessTokenGetsRevokedIn * 1000,
        );

        const refreshTokenExpiresIn: number =
            this.config.get('auth.rtExpiresIn');
        const refreshTokenGetsRevokedIn: number = refreshTokenExpiresIn * 2;
        const expiredRefreshTokenDate = new Date(
            now.getTime() - refreshTokenGetsRevokedIn * 1000,
        );

        await this.accessTokensRepository.nativeUpdate(
            {
                createdAt: {
                    $lte: expiredAccessTokenDate,
                },
            },
            {
                revoked: true,
            },
        );

        await this.refreshTokensRepository.nativeUpdate(
            {
                createdAt: {
                    $lte: expiredRefreshTokenDate,
                },
            },
            {
                revoked: true,
            },
        );
    }
}
