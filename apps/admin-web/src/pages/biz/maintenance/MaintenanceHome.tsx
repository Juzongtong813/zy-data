import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Space, Table, Tag, message } from 'antd';
import { maintenanceCreate, maintenanceList, maintenanceRemove, maintenanceUpdate, type MaintenanceItem } from '@/api/maintenance.api';
import { useLocation } from 'react-router-dom';

const configs = {
  personnel: { label:'人员', fields:[['personnelCode','人员编号'],['name','姓名'],['orgProvince','省级组织'],['orgCompany','公司/分公司'],['orgRegion','地市/区域'],['position','岗位'],['employmentType','用工类型'],['mobile','联系电话']] },
  vehicles: { label:'车辆', fields:[['plateNumber','车牌号'],['orgProvince','省级组织'],['orgCompany','公司/分公司'],['orgRegion','地市/区域'],['vehicleType','车辆类型'],['usage','用途'],['brandModel','品牌型号'],['fuelType','燃料类型'],['ownership','所有权']] },
  generators: { label:'油机', fields:[['generatorCode','油机编号'],['orgProvince','省级组织'],['orgCompany','公司/分公司'],['orgRegion','地市/区域'],['contactName','联系人'],['contactMobile','联系电话'],['model','规格型号'],['ratedPowerKw','额定功率'],['standardFuelConsumption','标准油耗'],['generatorType','机组类型'],['fuelType','燃料类型'],['ownership','所有权'],['usageStatus','使用状态']] },
} as const;
type Kind = keyof typeof configs;
export default function MaintenanceHome() { const location=useLocation(); const routeKind=location.pathname.split('/').pop() ?? ''; const kind:Kind=routeKind in configs ? routeKind as Kind : 'personnel'; const [items,setItems]=useState<MaintenanceItem[]>([]); const [total,setTotal]=useState(0); const [loading,setLoading]=useState(false); const [keyword,setKeyword]=useState(''); const [editing,setEditing]=useState<MaintenanceItem|null>(null); const [open,setOpen]=useState(false); const [form]=Form.useForm<any>();
  const load=async()=>{setLoading(true);try{const r=await maintenanceList(kind,{keyword,page:1,pageSize:50});setItems(r.items);setTotal(r.total);}catch(e){message.error('维护数据加载失败');}finally{setLoading(false);}}; useEffect(()=>{void load();},[kind]);
  const fields=configs[kind].fields; const submit=async()=>{try{const v=await form.validateFields(); if(editing) await maintenanceUpdate(kind,editing.id,v); else await maintenanceCreate(kind,v); message.success('保存成功');setOpen(false);form.resetFields();setEditing(null);void load();}catch(e){message.error('保存失败，请检查字段');}};
  return <Card title="维护管理" extra={<Space><Input placeholder="关键词" value={keyword} onChange={e=>setKeyword(e.target.value)} onPressEnter={()=>void load()} /><Button onClick={()=>void load()}>查询</Button><Button type="primary" onClick={()=>{setEditing(null);form.resetFields();setOpen(true);}}>新增{configs[kind].label}</Button></Space>}>
    <Table rowKey="id" loading={loading} dataSource={items} pagination={{total,pageSize:50,showSizeChanger:false}} columns={[...fields.slice(0,6).map(([dataIndex,title])=>({dataIndex,title})),{title:'状态',dataIndex:'status',render:(v:string)=><Tag color={v==='active'?'green':'default'}>{v==='active'?'启用':'停用'}</Tag>},{title:'操作',render:(_:unknown,row:MaintenanceItem)=><Space><Button size="small" onClick={()=>{setEditing(row);form.setFieldsValue(row);setOpen(true);}}>编辑</Button><Button danger size="small" onClick={async()=>{await maintenanceRemove(kind,row.id);void load();}}>停用</Button></Space>}]}/>
    <Modal title={`${editing?'编辑':'新增'}${configs[kind].label}`} open={open} onOk={()=>void submit()} onCancel={()=>setOpen(false)} destroyOnClose><Form form={form} layout="vertical">{fields.map(([name,label])=><Form.Item key={name} name={name} label={label} rules={['personnelCode','name','plateNumber','generatorCode','orgProvince','orgCompany','orgRegion'].includes(name)?[{required:true,message:`请输入${label}`}]:undefined}><Input /></Form.Item>)}</Form></Modal>
  </Card>;
}

