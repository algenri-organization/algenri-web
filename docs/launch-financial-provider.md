# ALGENRI — Provedor financeiro de lançamento

## Decisão
Para a fase inicial da ALGENRI, o **C6 Bank será o provedor financeiro principal de cobrança**, utilizando a conta PJ já existente da empresa faturadora.

A **Cora permanecerá como alternativa operacional/reserva**, especialmente para situações em que boleto, Pix ou outra condição da conta seja mais conveniente.

Não será aberta uma nova conta em provedor adicional apenas para o lançamento. Asaas e outros provedores poderão ser reavaliados quando houver necessidade real de integração por API, cobrança recorrente mais sofisticada, Pix Automático ou conciliação integrada à Área Interna.

## Motivos da escolha
- conta já existente e pronta para uso;
- link de pagamento com múltiplos meios;
- Pix no link sem tarifa na condição atual;
- cartão à vista e parcelado;
- possibilidade de receber vendas parceladas em prazo curto;
- menor complexidade operacional no início;
- evita adicionar fornecedor e integração antes de haver volume real de vendas.

## Condições atuais informadas no app C6
Condições visualizadas na conta no momento da definição:

- Pix: **0%**, recebimento na hora;
- débito à vista: **1,39%**, recebimento em 1 dia corrido;
- crédito à vista: **3,49%**, recebimento em 14 dias corridos;
- crédito parcelado em até 6 parcelas: **2,79%**, recebimento em 14 dias corridos;
- crédito parcelado de 7 a 12 parcelas: **3,09%**, recebimento em 14 dias corridos;
- crédito parcelado de 13 a 18 parcelas: **3,59%**, recebimento em 14 dias corridos;
- crédito parcelado: **1,29% adicional por parcela**;
- tarifa: **R$ 0,35 por venda confirmada**.

As taxas acima devem ser conferidas novamente no aplicativo antes de operações relevantes, pois são condições comerciais da conta e podem ser alteradas pelo banco.

## Política operacional de lançamento
1. Priorizar Pix quando for adequado ao cliente e à negociação.
2. Disponibilizar link C6 para débito ou cartão quando o cliente preferir.
3. Permitir parcelamento conforme negociação e condição prevista na proposta/contrato.
4. Considerar o custo financeiro do parcelamento na formação da proposta quando a ALGENRI assumir a taxa.
5. Utilizar a Cora como alternativa, sem criar dependência de um único canal de cobrança.
6. Registrar manualmente a cobrança e a confirmação de pagamento enquanto não houver integração financeira na plataforma.

## Evolução futura
Reavaliar o provedor quando houver volume suficiente para justificar:

- cobrança recorrente automatizada;
- Pix Automático;
- API de cobrança;
- conciliação automática;
- régua de cobrança/inadimplência;
- integração com projetos e contratos;
- integração com emissão fiscal.

A decisão futura deverá considerar custo total, facilidade de integração, antecipação, chargeback, experiência do cliente e confiabilidade operacional.