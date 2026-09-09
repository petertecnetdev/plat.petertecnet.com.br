import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Badge, Button, Col, Collapse, Form, Row } from "react-bootstrap";
import { apiBaseUrl, appId } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import "./Establishment.css";

const categoryOptions = [["restaurante","Restaurante"],["hamburgueria","Hamburgueria"],["sorveteria","Sorveteria"],["fast_food","Fast Food"],["doceria","Doceria"],["cafeteria","Cafeteria"],["pizzaria","Pizzaria"],["pub","Pub"]];
const segmentOptions = [["delivery","Delivery"],["retirada","Retirada no local"],["presencial","Consumo no local"],["balcao","Balcão"],["eventos","Eventos"],["catering","Catering"]];
const apiMessage=(error,fallback)=>error?.response?.data?.message||error?.response?.data?.error||(error?.response?.data?.errors?Object.values(error.response.data.errors).flat().join("\n"):"")||fallback;
const initials=(value,fallback="P")=>{const parts=String(value||"").trim().split(/\s+/).filter(Boolean);if(!parts.length)return fallback;return parts.slice(0,2).map(part=>part[0]).join("").toUpperCase();};

export default function EstablishmentCreatePage(){
 const navigate=useNavigate();
 const {register,handleSubmit,watch,formState:{errors,isSubmitting}}=useForm({defaultValues:{name:"",category:""}});
 const [showOptionalDetails,setShowOptionalDetails]=useState(false);
 const [logo,setLogo]=useState(null),[background,setBackground]=useState(null),[logoPreview,setLogoPreview]=useState(null),[backgroundPreview,setBackgroundPreview]=useState(null),[segments,setSegments]=useState([]);
 const establishmentName=watch("name"); const description=watch("description");
 const selectImage=(setter,previewSetter,maxMb)=>(event)=>{const file=event.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")||file.size>maxMb*1024*1024){Swal.fire("Imagem inválida",`Selecione uma imagem válida de até ${maxMb} MB.`,"warning");return;}setter(file);previewSetter(URL.createObjectURL(file));};
 const toggleSegment=value=>setSegments(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value]);
 const toggleOptionalDetails=()=>{setShowOptionalDetails(current=>!current);try{window.PeterTecnetTelemetry?.track?.("plat_establishment_details_toggled",{label:showOptionalDetails?"Ocultar dados opcionais":"Completar cadastro",target:"establishment_create"});}catch(_){/* telemetry must not interrupt onboarding */}};
 const onSubmit=async(data)=>{const token=localStorage.getItem("token");if(!token){Swal.fire("Erro","Sua sessão expirou. Entre novamente.","error");return;}const payload=new FormData();payload.append("app_id",String(appId));Object.entries(data).forEach(([key,value])=>{if(value!==undefined&&value!==null&&String(value).trim()!=="")payload.append(key,String(value).trim());});segments.forEach(segment=>payload.append("segments[]",segment));if(logo)payload.append("logo",logo);if(background)payload.append("background",background);try{const {data:response}=await axios.post(`${apiBaseUrl}/establishment`,payload,{headers:{Authorization:`Bearer ${token}`,"Content-Type":"multipart/form-data"}});try{window.PeterTecnetTelemetry?.track?.("plat_establishment_created",{label:data.name,target:"establishment_create",metadata:{onboarding_path:showOptionalDetails?"detailed":"quick",category:data.category}});}catch(_){/* telemetry must not interrupt onboarding */}navigate("/establishment",{replace:true,state:{establishmentCreated:true}});Swal.fire({toast:true,position:"top-end",icon:"success",title:response.message||"Empresa cadastrada com sucesso.",showConfirmButton:false,timer:1800,timerProgressBar:true});}catch(error){const apiErrors=error?.response?.data?.errors||{};if(Object.keys(apiErrors).some(field=>!["name","category"].includes(field)))setShowOptionalDetails(true);Swal.fire("Erro",apiMessage(error,"Não foi possível criar o estabelecimento."),error?.response?.status===422?"warning":"error");}};
 return <div className="establishment-root establishment-root--app"><NavlogComponent/><main className="establishment-create-page">
  <header className="establishment-page-header"><div><span className="establishment-eyebrow">Cadastro rápido</span><h1>Cadastre sua empresa em poucos segundos</h1><p>Comece com o essencial. Logo, endereço, contatos e demais informações podem ser adicionados agora ou depois.</p></div><Button variant="secondary" onClick={()=>navigate("/establishment")}>Cancelar</Button></header>

  <Form className="card-container" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" noValidate>
   <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-3">
    <div><span className="establishment-eyebrow">Etapa essencial</span><h2 className="h4 mt-2 mb-1">Identifique a empresa</h2><p className="text-secondary mb-0">Só precisamos do nome e da categoria para criar o estabelecimento.</p></div>
    <Badge bg="success" className="align-self-start">2 campos obrigatórios</Badge>
   </div>

   <Row className="g-3">
    <Col md={7}><Form.Group><Form.Label>Nome da empresa *</Form.Label><Form.Control autoFocus autoComplete="organization" placeholder="Ex.: Peter Food" isInvalid={Boolean(errors.name)} {...register("name",{required:"Informe o nome da empresa.",minLength:{value:2,message:"Use pelo menos 2 caracteres."}})}/><Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback></Form.Group></Col>
    <Col md={5}><Form.Group><Form.Label>Categoria *</Form.Label><Form.Select isInvalid={Boolean(errors.category)} {...register("category",{required:"Selecione uma categoria."})}><option value="">Selecione</option>{categoryOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{errors.category?.message}</Form.Control.Feedback></Form.Group></Col>
   </Row>

   <div className="alert alert-info mt-4 mb-0" role="status"><strong>Cadastro rápido:</strong> você pode criar a empresa agora e completar os dados depois na edição do estabelecimento.</div>

   <div className="d-flex flex-wrap gap-2 mt-4">
    <Button type="submit" disabled={isSubmitting}>{isSubmitting?"Criando empresa...":"Criar empresa"}</Button>
    <Button type="button" variant="outline-light" onClick={toggleOptionalDetails} aria-expanded={showOptionalDetails} aria-controls="establishment-optional-details">{showOptionalDetails?"Ocultar dados opcionais":"Completar dados opcionais"}</Button>
   </div>

   <Collapse in={showOptionalDetails}>
    <div id="establishment-optional-details">
     <hr className="my-4"/>
     <div className="mb-3"><span className="establishment-eyebrow">Perfil completo</span><h2 className="h4 mt-2 mb-1">Dados opcionais</h2><p className="text-secondary mb-0">Essas informações enriquecem a página pública e ajudam na operação, mas não precisam atrasar o primeiro cadastro.</p></div>

     <section className="plat-create-preview-card mb-4">
      <div className="plat-create-preview" style={backgroundPreview?{backgroundImage:`linear-gradient(90deg, rgba(4,8,13,.92), rgba(4,8,13,.60)), url('${backgroundPreview}')`}:undefined}>
       <div className="plat-create-logo">{logoPreview?<img src={logoPreview} alt="Prévia da logo"/>:<span>{initials(establishmentName,"P")}</span>}</div>
       <div className="plat-create-preview-copy"><span className="plat-create-preview-label">Prévia pública</span><h2>{establishmentName||"Nome do estabelecimento"}</h2><p>{description||"A descrição do estabelecimento aparecerá aqui."}</p>{segments.length>0&&<div className="plat-create-badges">{segments.map(segment=><Badge key={segment} className="plat-create-badge">{segmentOptions.find(([value])=>value===segment)?.[1]||segment}</Badge>)}</div>}</div>
      </div>
      <div className="plat-create-upload-actions"><label className="plat-create-upload-btn" htmlFor="estBackground">Alterar capa</label><label className="plat-create-upload-btn" htmlFor="estLogo">Alterar logo</label><input id="estBackground" type="file" accept="image/*" onChange={selectImage(setBackground,setBackgroundPreview,8)}/><input id="estLogo" type="file" accept="image/*" onChange={selectImage(setLogo,setLogoPreview,4)}/></div>
     </section>

     <Row className="g-4">
      <Col md={6}><Form.Label>Nome fantasia</Form.Label><Form.Control {...register("fantasy")}/></Col><Col md={3}><Form.Label>Tipo</Form.Label><Form.Control {...register("type")} placeholder="Ex.: dark kitchen"/></Col><Col md={3}><Form.Label>CNPJ</Form.Label><Form.Control inputMode="numeric" {...register("cnpj")}/></Col>
      <Col md={6}><Form.Label>Telefone</Form.Label><Form.Control inputMode="tel" {...register("phone")}/></Col><Col md={6}><Form.Label>E-mail</Form.Label><Form.Control type="email" {...register("email")}/></Col><Col xs={12}><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} {...register("description")}/></Col>
      <Col md={6}><Form.Label>Endereço</Form.Label><Form.Control {...register("address")}/></Col><Col md={3}><Form.Label>Cidade</Form.Label><Form.Control {...register("city")}/></Col><Col md={1}><Form.Label>UF</Form.Label><Form.Control maxLength={2} {...register("uf")}/></Col><Col md={2}><Form.Label>CEP</Form.Label><Form.Control inputMode="numeric" {...register("cep")}/></Col><Col xs={12}><Form.Label>Localização / Google Maps</Form.Label><Form.Control {...register("location")}/></Col><Col md={6}><Form.Label>Instagram</Form.Label><Form.Control type="url" {...register("instagram_url")}/></Col><Col md={6}><Form.Label>Site</Form.Label><Form.Control type="url" {...register("website_url")}/></Col>
      <Col xs={12}><Form.Label>Formatos de operação</Form.Label><div className="segments-checkbox-grid">{segmentOptions.map(([value,label])=><label className="form-check segment-check" key={value}><input className="form-check-input" type="checkbox" checked={segments.includes(value)} onChange={()=>toggleSegment(value)}/><span className="form-check-label">{label}</span></label>)}</div></Col>
     </Row>
    </div>
   </Collapse>
  </Form>
 </main></div>;
}
