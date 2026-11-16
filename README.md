<h1 align="center">Todo App</h1>

<table align="center">
  <tr>
    <th style="text-align: center;">NRP</th>
    <th style="text-align: center;">Nama</th>
    <th style="text-align: center;">Kelas</th>
  </tr>
  <tr>
    <td style="text-align: center;">5025251043</td>
    <td style="text-align: center;">Tri Zuyyina Rohmah</td>
    <td style="text-align: center;">PWEB A</td>
  </tr>
</table>

# [E06] The Endpoint of Portals - RESTful API

Pada tugas ini, fitur CRUD pada backend Todo App telah diubah menjadi REST API. Seluruh endpoint dikelola melalui file `api.php` dengan menggunakan resource `todos`. Sementara itu, frontend pada file `script.js` telah disesuaikan agar dapat berkomunikasi dengan backend melalui endpoint REST API tersebut.

## Ringkasan Implementasi

| No | Tugas | File | Keterangan |
|----|-------|------|------------|
| 1 | Migrasi CRUD ke REST API dengan method yang sesuai | `api.php`, `script.js` | Menggunakan GET untuk mengambil data, POST untuk menambahkan data, PUT dan PATCH untuk memperbarui data, serta DELETE untuk menghapus data. Resource menggunakan URL `api.php/todos` dan `api.php/todos/{id}` |
| 2 | Penggunaan response code yang sesuai pada setiap endpoint | `api.php` | Menggunakan `200` untuk GET, PUT, dan PATCH; `201` beserta header `Location` untuk POST; serta `204` untuk DELETE dan preflight OPTIONS |
| 3 | Penanganan error pada setiap endpoint | `api.php` | Menyediakan response code `400`, `404`, `405`, `413`, `415`, `422`, dan `500`. Setiap error dilengkapi dengan body JSON yang berisi pesan kesalahan |
| 4 | (Opsional) Autentikasi API Key | `auth.php`, `api.php`, `index.php`, `script.js` | Setiap request ke endpoint harus menyertakan API key melalui header `X-API-Key` atau `Authorization: Bearer` |

## Daftar Endpoint

| Method | URL | Fungsi | Sukses | Error |
|--------|-----|--------|--------|-------|
| GET | `/api.php/todos?scope=personal` | Mengambil daftar todo berdasarkan scope (`personal` atau `shared`) | `200` | `401`, `403`, `422` |
| GET | `/api.php/todos/{id}` | Mengambil detail todo berdasarkan ID | `200` | `400`, `401`, `403`, `404` |
| POST | `/api.php/todos` | Menambahkan todo baru menggunakan JSON atau `multipart/form-data` jika menyertakan gambar | `201` | `400`, `401`, `403`, `413`, `422` |
| PUT | `/api.php/todos/{id}` | Mengganti seluruh data todo | `200` | `400`, `401`, `403`, `404`, `415`, `422` |
| PATCH | `/api.php/todos/{id}` | Memperbarui sebagian data todo | `200` | `400`, `401`, `403`, `404`, `415`, `422` |
| DELETE | `/api.php/todos/{id}` | Menghapus todo beserta gambar yang terkait | `204` | `400`, `401`, `403`, `404` |

Pada frontend, setiap method digunakan sesuai dengan kebutuhan operasinya. PATCH digunakan ketika pengguna menandai todo sebagai selesai atau memperbarui status notifikasi. PUT digunakan untuk menyimpan perubahan pada todo yang diedit, POST untuk menambahkan todo baru, dan DELETE untuk menghapus todo.

## Response Code

### Response Berhasil

| Code | Dipakai saat |
|------|--------------|
| `200 OK` | Request GET, PUT, dan PATCH berhasil diproses. Response body berisi data todo |
| `201 Created` | Todo berhasil dibuat melalui POST. Response body berisi data todo yang baru dibuat, disertai header `Location: /api.php/todos/{id}` |
| `204 No Content` | Todo berhasil dihapus melalui DELETE atau request OPTIONS selesai diproses. Tidak ada response body yang dikirim |

### Response Error

| Code | Dipakai saat |
|------|--------------|
| `400 Bad Request` | ID yang diberikan bukan angka positif, format body JSON tidak valid, atau body PATCH kosong |
| `401 Unauthorized` | Request tidak menyertakan API key. Response juga dilengkapi header `WWW-Authenticate` |
| `403 Forbidden` | API key telah dikirim, tetapi nilainya tidak sesuai |
| `404 Not Found` | Todo dengan ID yang diminta tidak ditemukan atau endpoint yang diakses tidak tersedia |
| `405 Method Not Allowed` | Method HTTP yang digunakan tidak didukung oleh URL tersebut. Response dilengkapi header `Allow` untuk menunjukkan method yang diperbolehkan |
| `413 Payload Too Large` | Ukuran gambar yang diunggah melebihi batas yang ditentukan oleh server |
| `415 Unsupported Media Type` | Request PUT atau PATCH menggunakan `Content-Type` selain `application/json` |
| `422 Unprocessable Entity` | Data yang dikirim tidak memenuhi ketentuan, misalnya title atau description kosong, title melebihi 255 karakter, format tanggal tidak sesuai, scope tidak valid, atau file yang diunggah bukan gambar |
| `500 Internal Server Error` | Terjadi kesalahan saat server memproses request, misalnya karena masalah pada database. Detail kesalahan hanya disimpan dalam log server |

Jika terjadi kesalahan, server akan mengirimkan response dalam format JSON seperti berikut.

```json
{
  "error": "Data tidak valid.",
  "details": {
    "title": "Wajib diisi."
  }
}
```

## Autentikasi API Key

API key disimpan dan dikelola melalui file `auth.php`. Nilainya dapat diubah menggunakan environment variable `TODO_API_KEY`. Pada halaman web, API key dimasukkan ke dalam elemen `<meta name="api-key">` di file `index.php`, kemudian dibaca oleh `script.js` untuk disertakan dalam setiap request ke API.

Apabila API diakses menggunakan client lain, API key juga harus dikirim melalui salah satu dari dua header berikut.

```
X-API-Key: todo-5025251043-9f3c1a7e5b2d4c68
Authorization: Bearer todo-5025251043-9f3c1a7e5b2d4c68
```

Untuk membandingkan API key yang dikirim dengan key yang tersimpan, sistem menggunakan fungsi `hash_equals`. Penggunaan fungsi ini membantu mencegah timing attack saat proses perbandingan berlangsung.

## Contoh Penggunaan

Sebelum menjalankan perintah berikut, sesuaikan `localhost/Todo-App` dengan alamat dan lokasi project pada server lokal yang digunakan.

Mengambil daftar todo dengan scope personal:

```bash
curl -H "X-API-Key: todo-5025251043-9f3c1a7e5b2d4c68" "http://localhost/Todo-App/api.php/todos?scope=personal"
```

Menambahkan todo baru:

```bash
curl -i -X POST -H "X-API-Key: todo-5025251043-9f3c1a7e5b2d4c68" -H "Content-Type: application/json" -d '{"title":"Belajar REST","description":"Kerjakan E06","dueDate":"2026-12-01","scope":"personal"}' http://localhost/Todo-App/api.php/todos
```

Memperbarui status todo menjadi selesai:

```bash
curl -X PATCH -H "X-API-Key: todo-5025251043-9f3c1a7e5b2d4c68" -H "Content-Type: application/json" -d '{"completed":1}' http://localhost/Todo-App/api.php/todos/1
```

Menghapus todo berdasarkan ID:

```bash
curl -i -X DELETE -H "X-API-Key: todo-5025251043-9f3c1a7e5b2d4c68" http://localhost/Todo-App/api.php/todos/1
```

Selain request yang berhasil, beberapa perintah berikut dapat digunakan untuk menguji penanganan error pada API.

Mengirim request tanpa menyertakan API key:

```bash
curl -i http://localhost/Todo-App/api.php/todos
```

Mengakses todo dengan ID yang tidak ditemukan:

```bash
curl -i -H "X-API-Key: todo-5025251043-9f3c1a7e5b2d4c68" http://localhost/Todo-App/api.php/todos/9999
```

Mengirim data todo dengan title dan description kosong:

```bash
curl -i -X POST -H "X-API-Key: todo-5025251043-9f3c1a7e5b2d4c68" -H "Content-Type: application/json" -d '{"title":"","description":""}' http://localhost/Todo-App/api.php/todos
```
