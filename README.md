# LibriFlow — Sistem Manajemen Perpustakaan (Monorepo)

Sistem Manajemen Perpustakaan modern berbasis web

---

## 1. Ringkasan Proyek

Pengelolaan perpustakaan secara manual sering kali menimbulkan kendala seperti peminjaman ganda, ketidaksesuaian stok, serta keterlambatan pengembalian buku yang tidak terpantau secara akurat. **LibriFlow** menyediakan:
* **Frontend**: Aplikasi web responsif dan intuitif untuk staf sirkulasi perpustakaan.
* **Backend**: REST API terstruktur berbasis NestJS sebagai sumber kebenaran tunggal (*authoritative*) untuk seluruh validasi bisnis dan konsistensi inventaris.
* **Database**: PostgreSQL yang dikelola menggunakan Prisma ORM dengan dukungan transaksi atomik serta pembaruan bersyarat (*conditional updates*).

---

## 2. Teknologi & Alasan Pemilihan

| Layer | Teknologi | Tujuan / Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) + React | *Server-side rendering* cepat, arsitektur berbasis komponen modern |
| **Styling** | Tailwind CSS + Lucide Icons | Desain antarmuka bersih, minimalis, dan responsif untuk meja sirkulasi |
| **State & Cache** | TanStack Query v5 | Sinkronisasi status server, *caching*, dan pembatalan validasi data otomatis |
| **Validasi Formulir** | React Hook Form + Zod | Umpan balik validasi langsung di sisi klien dengan tipe DTO yang aman |
| **Backend** | NestJS + Node.js (TypeScript) | Struktur modular kelas enterprise (Controllers, Services, DTOs, Exceptions) |
| **Database** | PostgreSQL + Prisma ORM | Konsistensi relasional, isolasi level baris, dan integritas transaksi ACID |
| **Dokumentasi API** | Swagger / OpenAPI | Dokumentasi API interaktif yang dibuat otomatis di `/api/docs` |
| **Pengujian** | Jest + ts-jest | Pengujian berbasis TDD yang mencakup skenario sukses dan gagal |
| **Monorepo** | pnpm workspaces + Turborepo | Orkestrasi paket terpadu dengan berbagi kontrak tipe via `@lms/types` |

---

## 3. Arsitektur & Pemisahan Tanggung Jawab

```text
                     ┌───────────────────┐
                     │    Next.js Web    │
                     │     Frontend      │
                     └─────────┬─────────┘
                               │ REST API
                               ▼
                     ┌───────────────────┐
                     │    NestJS API     │
                     │                   │
                     │ Controllers       │
                     │ Services          │
                     │ Business Rules    │
                     │ Validation Pipes  │
                     └─────────┬─────────┘
                               │ Prisma Client
                               ▼
                     ┌───────────────────┐
                     │    PostgreSQL     │
                     └───────────────────┘
```

Frontend tidak pernah mengakses database PostgreSQL secara langsung. Seluruh operasi bisnis (batas peminjaman, pengecekan keterlambatan, pengurangan stok) diisolasi dan divalidasi secara ketat di backend.

---

## 4. Core Business Rules

### 1. Alur Peminjaman Buku:
* **Anggota Aktif**: Anggota berstatus tidak aktif akan ditolak (`MEMBER_INACTIVE`, HTTP 409).
* **Cek Keterlambatan**: Anggota yang memiliki buku yang telah melewati jatuh tempo tidak diizinkan meminjam buku lain (`OVERDUE_BORROWING_EXISTS`, HTTP 409).
* **Batas Maksimal Peminjaman**: Maksimal **3** buku aktif per anggota secara bersamaan (`BORROWING_LIMIT_REACHED`, HTTP 409).
* **Cek Stok Atomik**: Pengurangan stok dilakukan secara konkuren dan aman (`availableCopies > 0`). Jika stok habis (= 0), permintaan ditolak (`BOOK_OUT_OF_STOCK`, HTTP 409).

### 2. Alur Pengembalian Buku:
* **Pencegahan Pengembalian Ganda**: Peminjaman yang telah berstatus dikembalikan tidak dapat dikembalikan ulang (`ALREADY_RETURNED`, HTTP 409).
* **Perhitungan Hari Terlambat & Denda**:
  $$\text{lateDays} = \max(0, \text{tanggalKembali} - \text{jatuhTempo})$$
  $$\text{denda} = \text{lateDays} \times \text{DENDA\_HARIAN} \quad (\text{Rp 5.000/hari})$$
* **Pemulihan Stok**: Stok buku yang tersedia (*availableCopies*) otomatis bertambah 1 secara atomik.

---

## 5. Panduan Instalasi & Menjalankan Lokal

### Prasyarat
* Node.js `>= 20.0.0`
* pnpm (`npm i -g pnpm`)
* PostgreSQL 17 (Lokal atau Docker)

### Langkah Instalasi

```bash
# 1. Install seluruh dependensi monorepo
pnpm install

# 2. Siapkan file konfigurasi lingkungan (.env)
cp .env.example .env

# 3. Sinkronisasikan skema database dan masukkan data awal (seeder)
pnpm db:migrate
pnpm db:seed

# 4. Jalankan backend dan frontend secara bersamaan dalam mode dev
pnpm dev
```

* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:4000/api/v1`
* **Dokumentasi Swagger API**: `http://localhost:4000/api/docs`

---

## 6. Deployment dengan Docker

Menjalankan seluruh ekosistem (PostgreSQL, NestJS API, dan Next.js Web) menggunakan Docker Compose:

```bash
docker compose up -d --build
```

---

## 7. Testing Strategy (TDD)

```bash
# Menjalankan pengujian unit untuk aturan peminjaman & pengembalian
pnpm --filter @lms/api test

# Menjalankan pengujian integrasi End-to-End (E2E)
pnpm --filter @lms/api test:e2e

# Pengecekan tipe data TypeScript
pnpm --filter @lms/types typecheck
```

### Verified Test Cases:
* [x] Peminjaman berhasil mengurangi stok buku yang tersedia.
* [x] Peminjaman ditolak jika anggota berstatus tidak aktif (`MEMBER_INACTIVE`).
* [x] Peminjaman ditolak jika stok buku habis (`BOOK_OUT_OF_STOCK`).
* [x] Peminjaman ditolak jika anggota mencapai batas maksimal 3 buku (`BORROWING_LIMIT_REACHED`).
* [x] Peminjaman ditolak jika anggota memiliki pinjaman yang telah jatuh tempo (`OVERDUE_BORROWING_EXISTS`).
* [x] Pengembalian tepat waktu menghitung denda Rp 0 dan memulihkan stok.
* [x] Pengembalian terlambat menghitung hari telat serta akumulasi denda dengan benar.
* [x] Pengembalian ganda dicegah dan ditolak (`ALREADY_RETURNED`).
* [x] Alur kritis E2E teruji: Pendaftaran anggota $\to$ Pembuatan buku $\to$ Peminjaman $\to$ Validasi stok $\to$ Pengembalian $\to$ Pemulihan stok.

---

## 8. AI Usage Disclosure

* **AI Tools Used**: Antigravity Pair Programmer (Gemini 3.7 Flash).
* **Scope**: Scaffolded monorepo architecture, configured Turborepo pipelines, implemented strict domain business logic with NestJS, created responsive Tailwind/Next.js client with TanStack Query, and verified transactional guarantees.
* **Verification**: All generated code was manually reviewed, compiled, unit-tested via Jest (8/8 passing tests), and checked against the specifications.
