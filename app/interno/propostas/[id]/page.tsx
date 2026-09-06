import ProposalDetailAdmin from "@/components/proposals/proposal-detail-admin";
import ProposalDocumentActions from "@/components/proposals/proposal-document-actions";

export const metadata={title:"Proposta Comercial | ALGENRI",robots:{index:false,follow:false}};

export default async function ProposalPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <><ProposalDetailAdmin id={id}/><ProposalDocumentActions id={id}/></>;
}
