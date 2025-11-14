Remove-Item "d:\Easy2Work\Easy2Work - Multi-Tenant Configurable SaaS Platform\Source\prisma\dev.db" -Force -ErrorAction SilentlyContinue
-------------------
Remove-Item "d:\Easy2Work\Easy2Work - Multi-Tenant Configurable SaaS Platform\Source\prisma\migrations" -Recurse -Force -ErrorAction SilentlyContinue
------------------------------
npx prisma migrate dev --name init
------------------------------

Platform - platform@easy2work.com / Platform@123

tenant(may vary diff env)  - admin@kiruba-test.easy2work.com / 714c8cb1e21a9a37