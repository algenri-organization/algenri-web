import ProposalDetailAdmin from "@/components/proposals/proposal-detail-admin";
export const metadata={title:"Proposta Comercial | ALGENRI",robots:{index:false,follow:false}};
export default async function ProposalPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProposalDetailAdmin id={id}/>}
