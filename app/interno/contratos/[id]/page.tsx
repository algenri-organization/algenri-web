import ContractDetailAdmin from "@/components/contracts/contract-detail-admin";

export const metadata={title:"Contrato | ALGENRI",robots:{index:false,follow:false}};

export default async function ContractPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <ContractDetailAdmin id={id}/>;
}
