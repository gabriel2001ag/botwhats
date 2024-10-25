/**
 * Bot de Atendimento Automatizado - Maranatha Serviços Técnicos
 * Desenvolvido por Gabriel Agustineto
 * Data de Criação: 2024-10-24
 * Última Atualização: 2024-10-24
 * 
 * Este código implementa um bot automatizado para responder a mensagens do WhatsApp,
 * utilizando a biblioteca Venom-Bot. Ele gerencia o atendimento inicial,
 * envia mensagens de boas-vindas e realiza direcionamentos conforme o estado do usuário.
 */




const venom = require('venom-bot');

// Criar o bot com configurações personalizadas
venom
  .create({
    session: 'whatsapp-session',
    multidevice: true,
    folderNameToken: 'tokens',
    logQR: true,
    debug: true
  })
  .then((client) => start(client))
  .catch((error) => {
    console.error('Erro ao iniciar o Venom-bot:', error);
  });

// Objeto para manter o estado de atendimento
const userStates = {};

// Função principal que inicia o bot e lida com as mensagens recebidas
function start(client) {
  console.log('Bot está pronto para receber mensagens!');

  // Evento que é acionado quando uma nova mensagem é recebida
  client.onMessage((message) => {
    // Ignora mensagens de grupos
    if (message.isGroupMsg) return;

    // Inicializa o estado do usuário se não existir
    if (!userStates[message.from]) {
      userStates[message.from] = { waitingForAgent: false, lastMessageTime: null, hasReceivedWelcome: false };
      // Envia a mensagem de boas-vindas ao primeiro contato
      sendWelcomeMessage(client, message.from);
      userStates[message.from].hasReceivedWelcome = true; // Marca que já enviou a mensagem de boas-vindas
      return; // Sai da função para evitar lógica adicional
    }

    // Atualiza o tempo da última mensagem recebida
    const now = new Date();
    userStates[message.from].lastMessageTime = now;

    // Verifica se o usuário está aguardando um atendente
    if (userStates[message.from].waitingForAgent) {
      // Se o usuário digitar a opção 10, retorna a resposta automática
      if (message.body.trim() === '10') {
        userStates[message.from].waitingForAgent = false; // Resetar o estado
        sendWelcomeMessage(client, message.from); // Envia a mensagem inicial novamente
      }
      // Se não for a opção 10, não faz nada (silêncio)
      return;
    }

    // Verifica se a mensagem foi para as opções 1 ou 8
    if (message.body.trim() === '1' || message.body.trim() === '8') {
      // Define o estado de espera para as opções 1 e 8
      userStates[message.from].waitingForAgent = true;

      // Envia a mensagem correspondente
      let response;
      if (message.body.trim() === '1') {
        response = 'Você escolheu Solicitar Orçamento. Por favor, envie detalhes do serviço que você precisa para que possamos enviar um orçamento.\n' +
                   'Para encerrar o atendimento, digite 10.';
      } else {
        response = 'Aguarde um momento, iremos conectá-lo a um atendente.\nPara encerrar o atendimento, digite 10.';
      }
      client.sendText(message.from, response);

      // Inicia o temporizador de 2 minutos
      setTimeout(() => {
        userStates[message.from].waitingForAgent = false; // Permite novas mensagens após 30 minutos
      }, 30 * 60 * 1000); // 2 minutos em milissegundos

      return; // Ignora a execução do restante do código
    }

    // Obtém a resposta com base na mensagem recebida
    const response = getResponse(message.body, message.from);

    // Se a resposta for válida, envia a mensagem
    if (response) {
      client.sendText(message.from, response);
    } else {
      // Se a mensagem não corresponde a nenhuma opção e o temporizador não estiver ativo, reenviar o menu
      if (!userStates[message.from].waitingForAgent) {
        sendWelcomeMessage(client, message.from);
      }
    }
  });
}

// Função para enviar a mensagem de boas-vindas
function sendWelcomeMessage(client, user) {
  const welcomeMessage = `Olá! Seja bem-vindo à Maranatha Serviços Técnicos. Como podemos ajudar?\n\n` +
                         `Por favor, escolha uma das opções abaixo digitando o número correspondente:\n` +
                         `1 - Solicitar Orçamento\n` +
                         `2 - Horário de Funcionamento\n` +
                         `3 - Formas de Pagamento\n` +
                         `4 - Informações sobre Serviços\n` +
                         `5 - Manutenção e Suporte\n` +
                         `6 - Trocas e Devoluções\n` +
                         `7 - Trabalhe Conosco\n` +
                         `8 - Falar com Atendente\n` +
                         `9 - Promoções Atuais\n` +
                         `10 - Encerrar Atendimento\n\n` +
                         `Aguardamos sua escolha!`;

  client.sendText(user, welcomeMessage);
}

// Função para retornar a resposta com base na mensagem recebida
function getResponse(message, user) {
  switch (message.trim()) {
    case '2':
      return 'Nosso horário de funcionamento é de segunda a sexta-feira, das 8h às 18h.';
    case '3':
      return 'Aceitamos pagamento via transferência bancária, cartão de crédito e boleto. Entre em contato para mais detalhes.';
    case '4':
      return 'Oferecemos uma ampla gama de serviços para atender suas necessidades, incluindo:\n' +
             '- **Instalações Elétricas:** Projetos personalizados para residências e empresas, garantindo eficiência e segurança.\n' +
             '- **Manutenção:** Serviços de manutenção preventiva e corretiva para garantir o funcionamento adequado dos seus sistemas elétricos.\n' +
             '- **Segurança Eletrônica:** Soluções completas em segurança, incluindo instalação de sistemas de CFTV (circuito fechado de televisão) para monitoramento e gravação de vídeo, além de sistemas de alarmes que protegem seu imóvel contra invasões.\n' +
             '- **Automação Residencial e Comercial:** Instalação de sistemas de automação para controle de iluminação, climatização e segurança, além de automação de portões e cercas elétricas, proporcionando mais comodidade e segurança.\n' +
             'Estamos comprometidos em oferecer a melhor proteção e eficiência para o seu espaço. Para mais informações, entre em contato conosco!';
    case '5':
      return 'Para solicitar manutenção ou suporte, entre em contato pelo telefone (XX) XXXX-XXXX ou através do nosso site.';
    case '6':
      return 'Para trocas e devoluções de produtos ou serviços, consulte nossa política de devoluções ou fale com nosso suporte.';
    case '7':
      return 'Tem interesse em trabalhar conosco? Envie seu currículo para recrutamento@maranatha.com.br';
    case '9':
      return 'Confira nossas promoções no site! Temos descontos especiais em diversos serviços.';
    case '10':
      userStates[user].waitingForAgent = false; // Encerra qualquer estado de espera
      return 'Atendimento encerrado. Obrigado por entrar em contato.';
    default:
      return null;
  }
}
