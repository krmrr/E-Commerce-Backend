Build It Store Back-end

#### **Paket Kurulumu için;**

`pnpm install`

#### **Yapıladırma (.env);**

- Database <br>
    - Database hostu <br>
      `
      DATABASE_HOST=""
      `
    - Database portu <br>
      `
      DATABASE_PORT=""
      `
    - Database Kullanıcısı <br>
      `
      DATABASE_USER=""
      `
    - Database Şifresi <br>
      `
      DATABASE_PASSWORD=""
      `
    - Database Adı <br>
      `
      DATABASE_NAME=""
      `


- Linkler
  - Ödeme tamam ise gideceği link <br>
    `
    PAYMENTS_SUCCESS_URL=""
    `
  - Ödeme tamam değil ise gideceği link <br>
    `
    PAYMENTS_ERROR_URL=""
    `
  - Resim depolama link <br>
    `
    IMAGE_STORGE_URL=""
    `

#### **Proje Kurulumu için;**

**Not: `src/database/migration/` içerisin de olan snapshot ismi `.snapshot-{DATABASE_NAME}.json` olmasınna dikkat edin!** <br/>

**Not: Yüksek boyutlu bir yükleme olacağı için database yükleme boyutunu 40mb'a kadar yükseltiniz.<br>**


Database'de gerekli olan tablo kurulumları için <br>
`pnpm orm migration:up`

Database'de gerekli olan tablo içerisin de ola sütün kurulumları için <br>
`pnpm orm seeder:run`

Projeyi geliştirici modun da başlatmak için<br>
`pnpm dev`


#### **Istek Noktaları;**

- Categories
  - Create [POST] `{url}/api/categories` 
    - BODY JSON ( title:string,visibility:bolean ) 
  - Show [GET] `{url}/api/categories/{id}`
  - Index [GET] `{url}/api/categories/`
    - Parametre ( filter[title] = "$like:%{TITLE}%") 


