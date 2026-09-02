# Plat

Frontend React da Plat, plataforma Peter Tecnet para restaurantes, cardápios e pedidos.

## Desenvolvimento

```bash
npm install
npm start
```

## Produção

```bash
npm install
npm run build
```

O diretório `build/` é artefato gerado e não deve ser versionado.

## Regras do repositório

- Não versionar `.env`, `build/`, `vendor/`, arquivos de IDE ou dependências locais.
- Assets públicos ativos ficam em `public/`; prefira o logo oficial `public/images/plat-logo.svg` para identidade da Plat.
- Remova arquivos e componentes somente quando não houver rota, importação ou dependência ativa.
- O frontend depende da API Peter Tecnet configurada via variáveis de ambiente.
