|    NRP     |           Nama           |
| :--------: |      :------------:      |
| 5025251043 | Tri Zuyyina Rohmah       |

Todo App sederhana untuk mencatat dan mengatur tugas sehari-hari. Project ini dibuat untuk belajar dasar pengembangan web.

## Preview Todo-App
### Di browser
1. Light Mode
    ![Tampilan Light Mode](assets/light-mode1.png)
    ![Tampilan Light Mode](assets/light-mode2.png)
2. Dark Mode
    ![Tampilan Dark Mode](assets/dark-mode.png)
    ![Tampilan Dark Mode](assets/dark-mode2.png)

## Event Handler
1. Switch dark mode - light mode <br>
Terdapat fitur untuk berganti antara dark mode dan light mode di pojok kanan atas.
    ![darkmode](assets/switchtolight.png)
    ![lightmode](assets/switchtodark.png)

2. Todo-Detail<br>
Di bagian kanan, terdapat `section` Todo-Detail. Bagian ini berisi detail todo, seperti status, due date, dan deskripsi tambahan. Bagian ini akan berubah sesuai todo yang dipilih di `section` kiri
    ![Todo-Detail](assets/todo-detail.png)

3. Ceklis<br>
Untuk tiap todo-list, terdapat check box yang berfungsi untuk menandai 'todo' sudah selesai dikerjakan atauu tidak. Todo yang telah ditandai selesai akan berpindah ke urutan paling bawah serta status nya di bagian Todo-Detail akan berubah dari `In Progress` menjadi `Completed`<br>

    Tampilan sebelum todo paling atas diceklis
    ![Sebelum di ceklis](assets/before-ceklis.png)

    Tampilan sesudah diceklis
    ![Setelah di ceklis](assets/after-ceklis.png)

4. Edit Todo<br>
Di bagian Todo-Detail terdapat tombol `Edit` di pojok kanan bawah yang gunanya untuk mengubah judul, deskripsi, dan due date. Jika perubahan telah selesai dilakukan, terdapat dua pilihan tombol, `Save` untuk menyimpan dan `Cancel` untuk membatalkan perubahan.

    Sebelum diedit
    ![Deskripsi dan judul sebelum diedit](assets/before-edit.png)

    Mengubah judul todo
    ![Edit todo](assets/edit-todo.png)

    Tampilan setelah diubah
    ![setelah diedit](assets/after-edit-todo.png)

5. Delete Todo<br>
Selain `Edit`, juga terdapat tombol `Delete` di pojok kiri bawah Todo-Detail. Ini berfungsi untuk menghapus todo agar tidak bertumpuk. `Delete` tidak hanya terbatas pada todo yang telah diceklis. Sebelum benar benar terhapus akan ada konfirmasi terakhir apakah pengguna benar-benar ingin menghapus todo.

    Sebelum dihapus
    ![Tampilan sebelum dihapus](assets/before-del.png)

    Konfirmasi sebelum benar-benar dihapus
    ![Konfirmasi](assets/del-todo.png)

    Todo telah terhapus dari daftar
    ![Tampilan akhir](assets/res-del-todo.png)

6. Add New Todo<br>
Di bagian paling bawah Todo-App, terdapat form untuk menambahkan todo baru

    Form Add-Todo
    ![Add Todo](assets/add-todo.png)
    
    List todo akan diperbarui
    ![New Todo](assets/new-todo.png)
