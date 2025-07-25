const permissions = {
  barber_list: {
    permission: "barber_list",
    category: "Barbeiros",
    name: "Listar barbeiros",
    description: "Permite ao usuário listar barbeiros.",
  },
  barber_my: {
    permission: "barber_my",
    category: "Barbeiros",
    name: "Listar seus barbeiros",
    description: "Permite ao usuário listar os barbeiros de sua barbearia.",
  },
  barber_store: {
    permission: "barber_store",
    category: "Barbeiros",
    name: "Assoia barbeiro",
    description: "Permite ao usuário associar um novo barbeiro a sua barbearia.",
  },
  barber_update: {
    permission: "barber_update",
    category: "Barbeiros",
    name: "Atualizar barbeiro",
    description:
      "Permite ao usuário atualizar informações de um barbeiro existente.",
  },
  barber_destroy: {
    permission: "barber_destroy",
    category: "Barbeiros",
    name: "Remove barbeiro",
    description: "Permite ao usuário remover  um barbeiro de sua barbearia.",
  },

  barbershop_list: {
    permission: "barbershop_list",
    category: "Barbearias",
    name: "Listar barbearias",
    description: "Permite ao usuário listar barbearias.",
  },
  barbershop_My: {
    permission: "barbershop_my",
    category: "Barbearias",
    name: "Listar suas barbearias ",
    description: "Permite ao usuário listar suas prórias barbearias.",
  },
  barbershop_store: {
    permission: "barbershop_store",
    category: "Barbearias",
    name: "Criar barbearia",
    description: "Permite ao usuário criar uma nova barbearia.",
  },
  barbershop_update: {
    permission: "barbershop_update",
    category: "Barbearias",
    name: "Atualizar barbearia",
    description:
      "Permite ao usuário atualizar informações de uma barbearia existente.",
  },
  barbershop_destroy: {
    permission: "barbershop_destroy",
    category: "Barbearias",
    name: "Excluir barbearia",
    description: "Permite ao usuário excluir uma barbearia.",
  },
  item_scan: {
    permission: "item_scan",
    category: "Item",
    name: "Scanear item",
    description: "Permite ao usuário scanear os items.",
  },
  item_check: {
    permission: "item_check",
    category: "Item",
    name: "Validar item",
    description: "Permite ao usuário validar os items.",
  },
  item_list: {
    permission: "item_list",
    category: "Item",
    name: "Listar items",
    description: "Permite ao usuário listar items.",
  },
  item_config: {
    permission: "item_config",
    category: "Item",
    name: "Configurar item",
    description: "Permite ao usuário configurar item.",
  },
  item_create: {
    permission: "item_create",
    category: "Item",
    name: "Criar item",
    description: "Permite ao usuário criar item.",
  },
  user_list: {
    permission: "user_list",
    category: "Usuário",
    name: "Listar usuários",
    description: "Permite ao usuário listar usuários.",
  },
  user_create: {
    permission: "user_create",
    category: "Usuário",
    name: "Criar usuário",
    description: "Permite ao usuário cadastrar outros usuários.",
  },
  user_show: {
    permission: "user_show",
    category: "Usuário",
    name: "Ver usuário específico",
    description: "Permite ao usuário ver detalhes de um usuário específico.",
  },
  user_edit: {
    permission: "user_edit",
    category: "Usuário",
    name: "Editar usuário",
    description:
      "Permite ao usuário editar informações de um usuário existente.",
  },
  user_delete: {
    permission: "user_delete",
    category: "Usuário",
    name: "Excluir usuário",
    description: "Permite ao usuário excluir um usuário.",
  },
  user_config: {
    permission: "user_config",
    category: "Usuário",
    name: "Configurar usuário",
    description: "Permite ao usuário configurar opções de um usuário.",
  },
  event_config: {
    permission: "event_config",
    category: "Evento",
    name: "Configurar evento",
    description: "Permite ao usuário configurar evento.",
  },
  event_create: {
    permission: "event_create",
    category: "Evento",
    name: "Cadastrar evento",
    description: "Permite ao usuário cadastrar um novo evento.",
  },
  event_edit: {
    permission: "event_edit",
    category: "Evento",
    name: "Editar evento",
    description:
      "Permite ao usuário editar informações de um evento existente.",
  },
  event_delete: {
    permission: "event_delete",
    category: "Evento",
    name: "Excluir evento",
    description: "Permite ao usuário excluir um evento.",
  },
  ticket_view: {
    permission: "ticket_view",
    category: "Ingresso",
    name: "Visualizar ingresso",
    description:
      "Permite ao usuário visualizar informações detalhadas de um ingresso específico, incluindo seu status e detalhes do evento associado.",
  },
  ticket_create: {
    permission: "ticket_create",
    category: "Ingresso",
    name: "Cadastrar ingresso",
    description:
      "Permite ao usuário cadastrar ingressos para um evento específico.",
  },
  ticket_edit: {
    permission: "ticket_edit",
    category: "Ingresso",
    name: "Editar ingresso",
    description:
      "Permite ao usuário editar informações de um ingresso de evento existente.",
  },
  ticket_delete: {
    permission: "ticket_delete",
    category: "Ingresso",
    name: "Excluir ingresso",
    description: "Permite ao usuário excluir um ingresso de um evento.",
  },
  ticket_sale_view: {
    permission: "ticket_sale_view",
    category: "Venda",
    name: "Visualizar vendas de ingressos",
    description:
      "Permite ao usuário visualizar a quantidade de ingressos vendidos.",
  },
  ticket_sale_manage_own: {
    permission: "ticket_sale_manage_own",
    category: "Venda",
    name: "Gerenciar vendas próprias",
    description:
      "Permite ao usuário gerenciar seus próprios ingressos vendidos.",
  },
  ticket_sale_manage_others: {
    permission: "ticket_sale_manage_others",
    category: "Venda",
    name: "Gerenciar vendas de outros vendedores",
    description:
      "Permite ao usuário visualizar e gerenciar ingressos vendidos por outros vendedores.",
  },
  ticket_sale_report: {
    permission: "ticket_sale_report",
    category: "Venda",
    name: "Gerar relatório de vendas",
    description:
      "Permite ao usuário gerar relatórios detalhados das vendas de ingressos.",
  },
  ticket_sale_refund: {
    permission: "ticket_sale_refund",
    category: "Venda",
    name: "Processar reembolso de ingressos",
    description:
      "Permite ao usuário processar reembolsos de ingressos vendidos.",
  },
  ticket_sale_export: {
    permission: "ticket_sale_export",
    category: "Venda",
    name: "Exportar dados de vendas",
    description:
      "Permite ao usuário exportar os dados das vendas de ingressos.",
  },
  promoter_create: {
    permission: "promoter_create",
    category: "Promoter",
    name: "Cadastrar promoters no evento",
    description: "Permite ao usuário cadastrar promoters.",
  },
  promoter_edit: {
    permission: "promoter_edit",
    category: "Promoter",
    name: "Editar promoters do evento",
    description: "Permite ao usuário editar informações de promoters.",
  },
  promoter_delete: {
    permission: "promoter_delete",
    category: "Promoter",
    name: "Excluir promoters do evento",
    description: "Permite ao usuário excluir promoters associados a um evento.",
  },
  profile_create: {
    permission: "profile_create",
    category: "Perfil",
    name: "Criar perfil",
    description: "Permite ao usuário criar um novo perfil no sistema.",
  },
  profile_view: {
    permission: "profile_view",
    category: "Perfil",
    name: "Ver perfis",
    description: "Permite ao usuário ver perfis no sistema.",
  },
  profile_show: {
    permission: "profile_show",
    category: "Perfil",
    name: "Ver perfil específico",
    description: "Permite ao usuário ver um perfil específico no sistema.",
  },
  profile_delete: {
    permission: "profile_delete",
    category: "Perfil",
    name: "Excluir perfil",
    description: "Permite ao usuário excluir um perfil específico no sistema.",
  },
  profile_edit: {
    permission: "profile_edit",
    category: "Perfil",
    name: "Editar perfil",
    description:
      "Permite ao usuário editar informações de um perfil existente.",
  },
  profile_list: {
    permission: "profile_list",
    category: "Perfil",
    name: "Listar perfis",
    description: "Permite ao usuário listar os perfis existentes.",
  },
  permission_management: {
    permission: "permission_management",
    category: "Sistema",
    name: "Gerenciamento de permissões",
    description: "Permite ao usuário gerenciar as permissões dos perfis.",
  },
  role_management: {
    permission: "role_management",
    category: "Sistema",
    name: "Gerenciamento de papéis",
    description: "Permite ao usuário gerenciar os papéis e suas permissões.",
  },
  user_management: {
    permission: "user_management",
    category: "Usuário",
    name: "Gerenciamento de usuários",
    description: "Permite ao usuário gerenciar os usuários e seus perfis.",
  },
  report_view: {
    permission: "report_view",
    category: "Relatório",
    name: "Visualizar relatórios",
    description: "Permite ao usuário visualizar relatórios e estatísticas.",
  },
  production_scan: {
    permission: "production_scan",
    category: "Produção",
    name: "Scanear produção",
    description: "Permite ao usuário scanear as produções.",
  },
  production_validate: {
    permission: "production_validate",
    category: "Produção",
    name: "Validar produção",
    description: "Permite ao usuário validar as produções.",
  },
  production_list: {
    permission: "production_list",
    category: "Produção",
    name: "Listar produções",
    description: "Permite ao usuário listar produções.",
  },
  production_configure: {
    permission: "production_configure",
    category: "Produção",
    name: "Configurar produção",
    description: "Permite ao usuário configurar produções.",
  },
  production_create: {
    permission: "production_create",
    category: "Produção",
    name: "Criar produção",
    description: "Permite ao usuário criar produções.",
  },
  production_update: {
    permission: "production_update",
    category: "Produção",
    name: "Atualizar produção",
    description: "Permite ao usuário atualizar as produções.",
  },
  production_delete: {
    permission: "production_delete",
    category: "Produção",
    name: "Excluir produção",
    description: "Permite ao usuário excluir as produções.",
  },
};

export default permissions;
