import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Badge, Button, Col, Form, Row } from "react-bootstrap";
import { apiBaseUrl, appId } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import "./Establishment.css";

const categoryOptions = [["restaurante","Restaurante"],["hamburgueria","Hamburgueria"],["sorveteria","Sorveteria"],["fast_food","Fast Food"],["doceria","Doceria"],["cafeteria","Cafeteria"],["pizzaria","Pizzaria"],["pub","Pub"]];
const segmentOptions = [["delivery","Delivery"],["retirada","Retirada no local"],["presencial","Consumo no local"],["balcao","Balcão"],["eventos","Eventos"],["catering","Catering"]];
const apiMessage=(error,fallback)=>error?.response?.data?.message||error?.response?.data?.error||(error?.response?.data?.errors?Object.values(error.response.data.errors).flat().join("\n"):"")||fallback;
const initials=(value,fallback="P")=>{const parts=String(value||"").trim().split(/\s+/).filter(Boolean);if(!parts.length)return fallback;return parts.slice(0,2).map(part=>part[0]).join("").toUpperCase();};

export default function EstablishmentCreatePage(){
 const navigate=useNavigate();
 const {register,handleSubmit,watch,formState:{isSubmitting}}=useForm();
 const [logo,setLogo]=useState(null),[background,setBackground]=useState(null),[logoPreview,setLogoPreview]=useState(null),[backgroundPreview,setBackgroundPreview]=useState(null),[segments,setSegments]=useState([]);
 const establishmentName=watch("name"); const description=watch("description");
 const selectImage=(setter,previewSetter,maxMb)=>(event)=>{const file=event.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")||file.size>maxMb*1024*1024){Swal.fire("Imagem inválida",`Selecione uma imagem válida de até ${maxMb} MB.`,"warning");return;}setter(file);previewSetter(URL.createObjectURL(file));};
 const toggleSegment=value=>setSegments(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value]);
 const onSubmit=async(data)=>{const token=localStorage.getItem("token");if(!token){Swal.fire("Erro","Sua sessão expirou. Entre novamente.","error");return;}const payload=new FormData();payload.append("app_id",String(appId));Object.entries(data).forEach(([key,value])=>{if(value!==undefined&&value!==null&&String(value).trim()!=="")payload.append(key,String(value).trim());});segments.forEach(segment=>payload.append("segments[]",segment));if(logo)payload.append("logo",logo);if(background)payload.append("background",background);try{const {data:response}=await axios.post(`${apiBaseUrl}/establishment`,payload,{headers:{Authorization:`Bearer ${token}`,"Content-Type":"multipart/form-data"}});await Swal.fire("Sucesso",response.message||"Estabelecimento criado com sucesso.","success");navigate("/establishment");}catch(error){Swal.fire("Erro",apiMessage(error,"Não foi possível criar o estabelecimento."),error?.response?.status===422?"warning":"error");}};
 return <div className="establishment-root establishment-root--app"><NavlogComponent/><main className="establishment-create-page">
  <header className="establishment-page-header"><div><span className="establishment-eyebrow">Configuração</span><h1>Novo estabelecimento</h1><p>Cadastre a operação que será gerenciada pela Plat.</p></div><Button variant="secondary" onClick={()=>navigate("/establishment")}>Cancelar</Button></header>
  <section className="plat-create-preview-card">
   <div className="plat-create-preview" style={backgroundPreview?{backgroundImage:`linear-gradient(90deg, rgba(4,8,13,.92), rgba(4,8,13,.60)), url('${backgroundPreview}')`}:undefined}>
    <div className="plat-create-logo">{logoPreview?<img src={logoPreview} alt="Prévia da logo"/>:<span>{initials(establishmentName,"P")}</span>}</div>
    <div className="plat-create-preview-copy"><span className="plat-create-preview-label">Prévia pública</span><h2>{establishmentName||"Nome do estabelecimento"}</h2><p>{description||"A descrição do estabelecimento aparecerá aqui."}</p>{segments.length>0&&<div className="plat-create-badges">{segments.map(segment=><Badge key={segment} className="plat-create-badge">{segmentOptions.find(([value])=>value===segment)?.[1]||segment}</Badge>)}</div>}</div>
   </div>
   <div className="plat-create-upload-actions"><label className="plat-create-upload-btn" htmlFor="estBackground">Alterar capa</label><label className="plat-create-upload-btn" htmlFor="estLogo">Alterar logo</label><input id="estBackground" type="file" accept="image/*" onChange={selectImage(setBackground,setBackgroundPreview,8)}/><input id="estLogo" type="file" accept="image/*" onChange={selectImage(setLogo,setLogoPreview,4)}/></div>
  </section>
  <Form className="card-container" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data"><Row className="g-4">
   <Col md={6}><Form.Label>Nome *</Form.Label><Form.Control required {...register("name",{required:true})}/></Col><Col md={6}><Form.Label>Nome fantasia</Form.Label><Form.Control {...register("fantasy")}/></Col>
   <Col md={4}><Form.Label>Categoria *</Form.Label><Form.Select required {...register("category",{required:true})}><option value="">Selecione</option>{categoryOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</Form.Select></Col><Col md={4}><Form.Label>Tipo</Form.Label><Form.Control {...register("type")} placeholder="Ex.: restaurante, dark kitchen"/></Col><Col md={4}><Form.Label>CNPJ</Form.Label><Form.Control {...register("cnpj")}/></Col>
   <Col md={6}><Form.Label>Telefone</Form.Label><Form.Control {...register("phone")}/></Col><Col md={6}><Form.Label>E-mail</Form.Label><Form.Control type="email" {...register("email")}/></Col><Col xs={12}><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} {...register("description")}/></Col>
   <Col md={6}><Form.Label>Endereço</Form.Label><Form.Control {...register("address")}/></Col><Col md={3}><Form.Label>Cidade</Form.Label><Form.Control {...register("city")}/></Col><Col md={1}><Form.Label>UF</Form.Label><Form.Control maxLength={2} {...register("uf")}/></Col><Col md={2}><Form.Label>CEP</Form.Label><Form.Control {...register("cep")}/></Col><Col xs={12}><Form.Label>Localização / Google Maps</Form.Label><Form.Control {...register("location")}/></Col><Col md={6}><Form.Label>Instagram</Form.Label><Form.Control type="url" {...register("instagram_url")}/></Col><Col md={6}><Form.Label>Site</Form.Label><Form.Control type="url" {...register("website_url")}/></Col>
   <Col xs={12}><Form.Label>Formatos de operação</Form.Label><div className="segments-checkbox-grid">{segmentOptions.map(([value,label])=><label className="form-check segment-check" key={value}><input className="form-check-input" type="checkbox" checked={segments.includes(value)} onChange={()=>toggleSegment(value)}/><span className="form-check-label">{label}</span></label>)}</div></Col><Col xs={12} className="text-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting?"Salvando...":"Criar estabelecimento"}</Button></Col>
  </Row></Form>
 </main></div>;
}
