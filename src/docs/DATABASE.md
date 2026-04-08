TABLA USUARIOS

```sql
create table public.usuarios (
  id uuid references auth.users not null primary key,
  nombres text not null,
  apellidos text not null,
  dni text unique not null,
  cuil text unique not null,
  email text unique not null,
  perfil text not null,
  foto_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

Detalles de campos:

- perfil: valores: admin, supervisor, metre, mozo, cocinero, cantinero, cliente_reg, cliente_anon.

- foto_url: url del bucket de supabase