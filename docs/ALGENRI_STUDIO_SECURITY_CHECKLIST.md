# ALGENRI Studio — Checklist de segurança e configuração

## Secrets e variáveis de ambiente

As chaves de provedores devem permanecer exclusivamente em rotas server-side e em variáveis de ambiente do deploy. Nunca devem ser expostas em componentes client-side, commits, logs ou respostas de API.

Variáveis conhecidas do ecossistema Studio que devem ser tratadas como Sensitive/Secret no ambiente de produção:

- `ELEVENLABS_API_KEY`
- `MINIMAX_API_KEY`
- `HEYGEN_API_KEY`
- `HIGGSFIELD_API_KEY_SECRET`
- `KIE_API_KEY`
- credenciais Runway usadas pelo adapter atual
- credenciais/autenticação do worker de renderização

Ao revisar a Vercel, manter os mesmos nomes consumidos pelo código e alterar apenas a classificação/armazenamento seguro quando necessário. Nunca copiar valores de secrets para documentação.

## APIs internas

- Todas as rotas em `/api/internal/studio/...` devem exigir autenticação interna.
- Rotas vinculadas a um projeto devem validar `ownerUid`.
- Preferir `requireStudioProjectOwner()` em `lib/studio/project-auth.ts`.
- Validação de payload deve usar Zod ou validação explícita equivalente.
- Erros internos não devem retornar stack trace ou secrets ao cliente.
- Downloads privados devem validar autorização antes de fornecer bytes/URL.

## Portal externo

O portal de aprovação do cliente é público por token e, portanto, deve obedecer às seguintes regras:

- token deve ser aleatório e não sequencial;
- desativar o portal deve invalidar o acesso funcional;
- não retornar `internalNotes`;
- não retornar custos internos ou dados de integração;
- não retornar API keys, storage paths sensíveis ou metadados administrativos;
- comentários do cliente devem ter limites de tamanho e validação;
- aprovação externa não deve disparar geração paga automaticamente.

## Storage e assets

- arquivos finais e assets de projeto permanecem privados por padrão;
- URLs assinadas devem ter expiração curta;
- referências externas não devem ser tratadas como confiáveis sem validação;
- ao excluir projeto, remover arquivos vinculados ao prefixo daquele projeto quando aplicável;
- ao duplicar projeto como modelo, copiar apenas assets intencionais e limpar estados de geração/aprovação.

## Custos

- toda operação paga deve continuar dependendo de ação explícita;
- dry runs e estimativas não podem silenciosamente converter-se em geração;
- registrar consumo real retornado pelo provedor sempre que disponível;
- não executar testes pagos apenas para validar layout, formulário ou persistência.

## Auditoria

Eventos relevantes devem ser preservados na governança do projeto, especialmente:

- cálculo/recalculo de roteamento;
- política de roteamento utilizada;
- provider/modelo selecionado;
- prompt técnico relevante;
- custo estimado e custo real;
- aprovação/reprovação quando impactar produção;
- futuras mudanças manuais de motor, caso sejam adicionadas ao fluxo.

## Revisão periódica

Antes de uma nova fase de produção real:

1. confirmar build/deploy da `main`;
2. revisar secrets na Vercel;
3. rotacionar qualquer credencial que tenha sido exposta fora do gerenciador de secrets;
4. confirmar regras de acesso Firebase/Firestore e Storage;
5. testar acesso negado com usuário não proprietário;
6. testar portal desativado/token inválido;
7. executar preflight sem geração paga;
8. somente então realizar um teste de produção controlado.
