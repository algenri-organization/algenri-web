import ProposalDetailAdmin from "@/components/proposals/proposal-detail-admin";
import ProposalDocumentActions from "@/components/proposals/proposal-document-actions";
import ProposalToContractAction from "@/components/contracts/proposal-to-contract-action";

export const metadata={title:"Proposta Comercial | ALGENRI",robots:{index:false,follow:false}};

export default async function ProposalPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <><ProposalDetailAdmin id={id}/><ProposalToContractAction id={id}/><ProposalDocumentActions id={id}/></>;
}
