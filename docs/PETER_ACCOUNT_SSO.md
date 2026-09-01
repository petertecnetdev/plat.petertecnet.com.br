# Conta Peter Tecnet

A Plat inicializa o `PeterAccountGateway` antes do aplicativo. O gateway recebe o handoff de uso único, troca-o por uma sessão própria da Plat e só depois inicializa o restante do frontend.

O launcher mostra os produtos ativos da conta, respeita o vínculo de acesso retornado pela API e envia apenas o código temporário `peter_sso` ao trocar de subdomínio. JWTs não são enviados em query string.
