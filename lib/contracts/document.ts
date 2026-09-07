import { getContract } from "@/lib/contracts/store";
import { getCommercialProposal } from "@/lib/proposals/store";
import { getClient, getProject } from "@/lib/client-flow/store";

function sectionContent(sections:{key:string;content:string}[],key:string){return sections.find(section=>section.key===key)?.content?.trim()||"";}
function money(value:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value||0);}

export async function buildContractDocument(contractId:string){
  const contract=await getContract(contractId); if(!contract)throw new Error("contract_not_found");
  const [proposal,client,project]=await Promise.all([getCommercialProposal(contract.proposalId),getClient(contract.clientId),getProject(contract.projectId)]);
  if(!proposal||!client||!project)throw new Error("contract_context_not_found");

  const scope=sectionContent(proposal.sections,"scope");
  const deliverables=sectionContent(proposal.sections,"deliverables");
  const exclusions=sectionContent(proposal.sections,"exclusions");
  const schedule=sectionContent(proposal.sections,"schedule");
  const clientResponsibilities=sectionContent(proposal.sections,"client_responsibilities");
  const commercialConditions=proposal.commercialConditions?.trim()||sectionContent(proposal.sections,"commercial_conditions");

  const contractor={
    legalName:process.env.ALGENRI_LEGAL_NAME||"JM MIND E PERFORMANCE LTDA",
    taxId:process.env.ALGENRI_LEGAL_CNPJ||"[PREENCHER CNPJ]",
    address:process.env.ALGENRI_LEGAL_ADDRESS||"[PREENCHER ENDEREÇO]",
    representative:process.env.ALGENRI_LEGAL_REPRESENTATIVE||"[PREENCHER REPRESENTANTE]",
  };
  const contracting={
    legalName:client.legalName||client.tradeName||contract.clientName,
    tradeName:client.tradeName||"",
    taxId:client.taxId||"[PREENCHER CNPJ/CPF]",
    address:[client.city,client.state,client.country].filter(Boolean).join(" / ")||"[PREENCHER ENDEREÇO]",
    representative:client.primaryContact?.name||"[PREENCHER REPRESENTANTE]",
  };

  const clauses=[
    {title:"1. Objeto",content:`Prestação dos serviços descritos na Proposta Comercial ALGENRI nº ${proposal.proposalNumber}, versão ${proposal.version}, aprovada pela CONTRATANTE, vinculada ao projeto “${project.name}”. A proposta integra este contrato para definição do escopo técnico e comercial.`},
    {title:"2. Escopo e entregáveis",content:[scope||"O escopo será aquele definido na proposta comercial aprovada.",deliverables?`\nEntregáveis:\n${deliverables}`:"",exclusions?`\nItens não incluídos:\n${exclusions}`:""].join("")},
    {title:"3. Prazo",content:`Início previsto: ${contract.startDate||"[A DEFINIR]"}. Término previsto: ${contract.endDate||"[A DEFINIR]"}.${schedule?`\n\nCronograma de referência da proposta:\n${schedule}`:"\n\nO cronograma definitivo depende das validações, conteúdos, acessos e aprovações necessários ao projeto."}`},
    {title:"4. Investimento e pagamento",content:`Valor inicial do projeto: ${money(contract.initialValue)}.\nRecorrência mensal, quando aplicável: ${money(contract.recurringMonthly)}.\nRecorrência anual, quando aplicável: ${money(contract.recurringAnnual)}.\n\nForma e condições de pagamento: ${contract.paymentTerms||"conforme proposta aprovada"}.${commercialConditions?`\n\nCondições comerciais complementares:\n${commercialConditions}`:""}`},
    {title:"5. Serviços e custos de terceiros",content:"Domínios, hospedagens, plataformas, APIs, meios de pagamento, licenças, serviços de nuvem e demais itens de terceiros somente estarão incluídos quando expressamente previstos na proposta. Custos não previstos poderão ser contratados diretamente pela CONTRATANTE ou formalizados separadamente."},
    {title:"6. Responsabilidades da CONTRATADA",content:"Executar os serviços contratados com diligência técnica, manter comunicação sobre a evolução do projeto, preservar a confidencialidade das informações recebidas e entregar os itens definidos no escopo aprovado."},
    {title:"7. Responsabilidades da CONTRATANTE",content:clientResponsibilities||"Fornecer informações, conteúdos, acessos e aprovações necessários; indicar responsável para decisões; validar entregas nos prazos acordados; e cumprir as condições de pagamento estabelecidas."},
    {title:"8. Aprovações e alterações de escopo",content:"Entregas submetidas à validação deverão ser analisadas pela CONTRATANTE. Solicitações que alterem o escopo originalmente aprovado poderão gerar revisão de prazo, investimento e condições, mediante registro complementar."},
    {title:"9. Propriedade intelectual",content:"Após a quitação dos valores devidos, a CONTRATANTE terá os direitos de uso das entregas desenvolvidas especificamente para o projeto, ressalvados componentes, bibliotecas, frameworks, métodos, ferramentas próprias da ALGENRI/JM MIND e soluções de terceiros sujeitas às respectivas licenças."},
    {title:"10. Confidencialidade e proteção de dados",content:"As partes comprometem-se a tratar informações confidenciais de forma adequada e a observar a legislação aplicável de proteção de dados pessoais. A Política de Privacidade da ALGENRI aplica-se aos dados coletados por seus canais digitais quando pertinente."},
    {title:"11. Suporte, manutenção e evolução",content:"Suporte, manutenção, evolução contínua e serviços recorrentes somente estarão incluídos quando previstos na proposta aprovada ou contratados posteriormente."},
    {title:"12. Rescisão",content:"O contrato poderá ser rescindido por acordo entre as partes ou por descumprimento contratual. Permanecerão devidos os valores correspondentes aos serviços já executados, custos assumidos e etapas concluídas até a data da rescisão."},
    {title:"13. Disposições gerais",content:`A Proposta Comercial ${proposal.proposalNumber}, versão ${proposal.version}, integra este contrato. Em caso de divergência sobre escopo, valores, entregáveis ou condições específicas, prevalecem os registros expressamente aprovados na proposta e em eventuais aditivos.`},
    {title:"14. Foro",content:`Fica eleito o foro de ${process.env.ALGENRI_CONTRACT_FORUM||"[PREENCHER CIDADE/UF]"}, salvo disposição legal obrigatória em contrário.`},
  ];

  return {contract,proposal,client,project,contractor,contracting,clauses,operationalNotice:"Modelo contratual operacional de lançamento. Antes do uso definitivo em escala, recomenda-se revisão jurídica e preenchimento dos dados societários ainda pendentes."};
}
