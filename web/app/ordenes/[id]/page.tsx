'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { apiRequest, API_URL } from '../../../lib/api';
import { Sidebar } from '../../../components/Sidebar';

type WorkOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  assetId?: string | null;
  statusId: string;
  orderType?: string | null;
  priority?: string | null;
  internalNotes?: string | null;
  initialDiagnosis?: string | null;
  technicalDiagnosis?: string | null;
  clientNotes?: string | null;
  totalAmount?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  quoteApproved?: boolean | null;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  promisedAt?: string | null;
};

type Branch = {
  id: string;
  name: string;
  settings?: { taxRate?: number } | null;
};

type Customer = {
  id: string;
  firstName: string;
  lastName?: string | null;
  legalName?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
};

type Asset = {
  id: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  assetType?: string | null;
};

type WorkOrderStatus = { id: string; name: string; code?: string | null };

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
};

type WorkOrderComment = {
  id: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  user?: { id: string; firstName: string; lastName?: string | null } | null;
};

type WorkOrderTask = {
  id: string;
  title: string;
  description?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  unitCost?: number | null;
  unitPrice?: number | null;
};

type Service = {
  id: string;
  name: string;
  cost?: number | null;
  price?: number | null;
};

type WorkOrderItem = {
  id: string;
  itemType: 'product' | 'service' | 'additional';
  productId?: string | null;
  serviceId?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountPercent?: number | null;
};

const ADDITIONAL_TYPE_PREFIX = {
  product: '[ADIC_PROD]',
  service: '[ADIC_SERV]',
} as const;

function parseAdditionalDescription(raw?: string | null) {
  const text = stripHiddenMeta(cleanItemTag(raw || '')).trim();
  if (text.startsWith(ADDITIONAL_TYPE_PREFIX.service)) {
    return { kind: 'service' as const, text: text.replace(ADDITIONAL_TYPE_PREFIX.service, '').trim() };
  }
  if (text.startsWith(ADDITIONAL_TYPE_PREFIX.product)) {
    return { kind: 'product' as const, text: text.replace(ADDITIONAL_TYPE_PREFIX.product, '').trim() };
  }
  return { kind: 'product' as const, text };
}

function cleanItemTag(raw?: string | null) {
  return (raw || '').replace(/^\[ITEM:[^\]]+\]\s*/i, '').trim();
}

function getHiddenMeta(raw?: string | null): { unitPrice: number; discountPercent: number } | null {
  const text = (raw || '').trim();
  const match = text.match(/\[\[HIDDEN:u=([0-9.]+);d=([0-9.]+)\]\]/i);
  if (!match) return null;
  return {
    unitPrice: Number(match[1] || 0),
    discountPercent: Number(match[2] || 0),
  };
}

function stripHiddenMeta(raw?: string | null) {
  return (raw || '').replace(/\s*\[\[HIDDEN:u=[0-9.]+;d=[0-9.]+\]\]\s*/gi, ' ').replace(/\s+/g, ' ').trim();
}

function withHiddenMeta(raw: string, unitPrice: number, discountPercent: number) {
  const clean = stripHiddenMeta(raw);
  return `${clean} [[HIDDEN:u=${Number(unitPrice || 0)};d=${Number(discountPercent || 0)}]]`.trim();
}

const STATUS_LABELS = {
  entrada: 'Entrada',
  domicilio: 'Domicilio',
  reparacion: 'Reparación',
  salida: 'Salida',
};

const STATUS_OPTIONS_BY_AREA: Record<'entrada' | 'domicilio' | 'reparacion' | 'salida', string[]> = {
  entrada: ['Chequeo', 'Sin estado'],
  domicilio: ['Chequeo', 'Sin estado'],
  reparacion: ['Chequeo', 'Esperando repuesto', 'Esperando respuesta', 'Reparación'],
  salida: ['Cambio', 'Instalado', 'No presentó falla', 'No reparado', 'Reparado', 'Retenido', 'Sin solución'],
};

const STATUS_CODES_BY_AREA: Record<'entrada' | 'domicilio' | 'reparacion' | 'salida', string[]> = {
  entrada: ['chequeo', 'sin_estado'],
  domicilio: ['chequeo', 'sin_estado'],
  reparacion: ['chequeo', 'esperando_repuesto', 'esperando_respuesta', 'reparacion', 'en_reparacion'],
  salida: ['cambio', 'instalado', 'no_presento_falla', 'no_reparado', 'reparado', 'retenido', 'sin_solucion'],
};

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function normalizeArea(value?: string | null): 'entrada' | 'domicilio' | 'reparacion' | 'salida' {
  const text = normalizeText(value);
  if (text.includes('domicilio') || text.includes('terreno')) return 'domicilio';
  if (text.includes('reparac')) return 'reparacion';
  if (text.includes('salida') || text.includes('entrega')) return 'salida';
  return 'entrada';
}

function formatOrderNumber(value?: string | null) {
  if (!value) return '';
  const digits = value.match(/\d+/g)?.join('') || '';
  if (!digits) return value;
  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return digits;
  return String(parsed);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractResponsable(notes?: string | null) {
  if (!notes) return '—';
  const match = notes.match(/responsable\s*:\s*(.+)/i);
  if (match?.[1]) return match[1].trim();
  return notes.trim() || '—';
}

function inferStatusCodeForArea(
  order: WorkOrder | null,
  status: WorkOrderStatus | null,
  area: 'entrada' | 'domicilio' | 'reparacion' | 'salida',
) {
  const allowedCodes = (STATUS_CODES_BY_AREA[area] || []).map((c) => normalizeText(c));
  const code = normalizeText(status?.code || '');
  if (code && allowedCodes.includes(code)) return code;

  const name = normalizeText(status?.name || '');
  const allowedNames = (STATUS_OPTIONS_BY_AREA[area] || []).map((label) => normalizeText(label));
  const nameMatch = allowedNames.find((label) => name === label || name.includes(label));
  if (nameMatch) {
    if (nameMatch.includes('sin estado')) return 'sin_estado';
    if (nameMatch.includes('chequeo')) return 'chequeo';
    if (nameMatch.includes('esperando repuesto')) return 'esperando_repuesto';
    if (nameMatch.includes('esperando respuesta')) return 'esperando_respuesta';
    if (nameMatch.includes('reparacion')) return 'reparacion';
    if (nameMatch.includes('cambio')) return 'cambio';
    if (nameMatch.includes('instalado')) return 'instalado';
    if (nameMatch.includes('no presento falla')) return 'no_presento_falla';
    if (nameMatch.includes('no reparado')) return 'no_reparado';
    if (nameMatch.includes('reparado')) return 'reparado';
    if (nameMatch.includes('retenido')) return 'retenido';
    if (nameMatch.includes('sin solucion')) return 'sin_solucion';
  }

  const haystack = normalizeText(
    [order?.technicalDiagnosis, order?.initialDiagnosis, order?.clientNotes].filter(Boolean).join(' '),
  );

  if (area === 'salida') {
    if (haystack.includes('no reparad')) return 'no_reparado';
    if (haystack.includes('sin solucion')) return 'sin_solucion';
    if (haystack.includes('retenid')) return 'retenido';
    if (haystack.includes('instalad')) return 'instalado';
    if (haystack.includes('no present')) return 'no_presento_falla';
    if (haystack.includes('cambi')) return 'cambio';
    return 'reparado';
  }

  if (area === 'reparacion') {
    if (haystack.includes('repuesto')) return 'esperando_repuesto';
    if (haystack.includes('respuesta')) return 'esperando_respuesta';
    if (haystack.includes('reparac')) return 'reparacion';
    if (haystack.includes('cheque')) return 'chequeo';
    return 'esperando_respuesta';
  }

  if (haystack.includes('sin estado')) return 'sin_estado';
  return 'chequeo';
}

function statusLabelFromCode(
  area: 'entrada' | 'domicilio' | 'reparacion' | 'salida',
  code: string,
) {
  const map: Record<string, string> = {
    chequeo: 'Chequeo',
    sin_estado: 'Sin estado',
    esperando_repuesto: 'Esperando repuesto',
    esperando_respuesta: 'Esperando respuesta',
    reparacion: 'Reparación',
    cambio: 'Cambio',
    instalado: 'Instalado',
    no_presento_falla: 'No presentó falla',
    no_reparado: 'No reparado',
    reparado: 'Reparado',
    retenido: 'Retenido',
    sin_solucion: 'Sin solución',
  };
  if (map[code]) return map[code];
  const fallback = (STATUS_OPTIONS_BY_AREA[area] || [])[0];
  return fallback || 'Chequeo';
}

export default function OrdenDetallePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [status, setStatus] = useState<WorkOrderStatus | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tareas' | 'notas' | 'archivos' | 'diagnosticos'>('tareas');
  const [comments, setComments] = useState<WorkOrderComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [tasks, setTasks] = useState<WorkOrderTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newDiagnostic, setNewDiagnostic] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingDetailField, setEditingDetailField] = useState<'trabajo' | 'estado' | 'accesorios' | null>(null);
  const [detailDraft, setDetailDraft] = useState('');
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [itemType, setItemType] = useState<'product' | 'service' | 'additional'>('product');
  const [itemProductId, setItemProductId] = useState('');
  const [itemServiceId, setItemServiceId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState(0);
  const [itemUnitCost, setItemUnitCost] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [openItemMenuId, setOpenItemMenuId] = useState<string | null>(null);
  const [itemMenuPosition, setItemMenuPosition] = useState<{
    id: string;
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);
  const [showItemComposer, setShowItemComposer] = useState(false);
  const [showAdditionalModal, setShowAdditionalModal] = useState(false);
  const [additionalKind, setAdditionalKind] = useState<'product' | 'service'>('product');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [additionalNetAmount, setAdditionalNetAmount] = useState(0);
  const [additionalIvaPercent, setAdditionalIvaPercent] = useState(0);
  const [editingItemDraft, setEditingItemDraft] = useState<{
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    description: string;
  } | null>(null);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState(19);
  const [statuses, setStatuses] = useState<WorkOrderStatus[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showApprovalResponseModal, setShowApprovalResponseModal] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<'approved' | 'rejected'>('approved');
  const [approvalResponseNote, setApprovalResponseNote] = useState('');
  const [showDigitalOrderModal, setShowDigitalOrderModal] = useState(false);
  const [sendByEmail, setSendByEmail] = useState(false);
  const [sendBySms, setSendBySms] = useState(false);
  const [sendByWhatsapp, setSendByWhatsapp] = useState(true);
  const [digitalMessage, setDigitalMessage] = useState('');
  const [statusAreaSelection, setStatusAreaSelection] =
    useState<'entrada' | 'domicilio' | 'reparacion' | 'salida'>('entrada');
  const [statusSelection, setStatusSelection] = useState('');
  const [whatsappConnection, setWhatsappConnection] =
    useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [savingAdditional, setSavingAdditional] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [showHideItemModal, setShowHideItemModal] = useState(false);
  const [hideItemTarget, setHideItemTarget] = useState<WorkOrderItem | null>(null);
  const [hideAddCustomItem, setHideAddCustomItem] = useState(false);
  const [savingHideItem, setSavingHideItem] = useState(false);
  const [showItemNoteModal, setShowItemNoteModal] = useState(false);
  const [itemNoteItem, setItemNoteItem] = useState<WorkOrderItem | null>(null);
  const [itemNoteText, setItemNoteText] = useState('');
  const [savingItemNote, setSavingItemNote] = useState(false);
  const [uiNotice, setUiNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const itemMenuRef = useRef<HTMLDivElement | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const apiBase = API_URL;

  useEffect(() => {
    if (!uiNotice) return;
    const t = setTimeout(() => setUiNotice(null), 2600);
    return () => clearTimeout(t);
  }, [uiNotice]);

  const refreshWhatsAppConnection = async () => {
    if (!token) return;
    try {
      const qr = await apiRequest<{ status?: string; connected?: boolean }>(
        '/integrations/messaging/whatsapp-qr/status',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const statusValue = (qr?.status || '').toLowerCase();
      const connected =
        qr?.connected === true ||
        statusValue === 'ready' ||
        statusValue === 'authenticated' ||
        statusValue === 'connected';
      setWhatsappConnection(connected ? 'connected' : 'disconnected');
    } catch {
      setWhatsappConnection('error');
    }
  };

  const refreshOrderData = async () => {
    if (!token || !params?.id) return;
    setRefreshing(true);
    try {
      const id = params.id;
      const [data, statusList] = await Promise.all([
        apiRequest<WorkOrder>(`/work-orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest<WorkOrderStatus[]>('/work-order-statuses', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setOrder(data);
      setGeneralDiscount(Number(data.discountAmount || 0));
      setStatuses(statusList);
      const currentStatus = statusList.find((s) => s.id === data.statusId) || null;
      setStatus(currentStatus);
      setStatusSelection(currentStatus?.id || data.statusId);
      setStatusAreaSelection(normalizeArea(data.orderType || currentStatus?.name || 'entrada'));

      const requests: Promise<any>[] = [
        apiRequest<Customer>(`/customers/${data.customerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(setCustomer),
        apiRequest<Attachment[]>(
          `/files?entityType=work_order&entityId=${encodeURIComponent(id)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ).then(setAttachments),
        apiRequest<WorkOrderComment[]>(`/work-orders/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(setComments),
        apiRequest<WorkOrderTask[]>(`/work-orders/${id}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(setTasks),
        apiRequest<WorkOrderItem[]>(`/work-orders/${id}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(setItems),
      ];

      if (data.assetId) {
        requests.push(
          apiRequest<Asset>(`/assets/${data.assetId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(setAsset),
        );
      } else {
        setAsset(null);
      }

      if (data.branchId) {
        requests.push(
          apiRequest<Branch>(`/branches/${data.branchId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((branchData) => {
            setBranch(branchData);
            const rate = Number(branchData?.settings?.taxRate);
            if (Number.isFinite(rate) && rate > 0) {
              setTaxRateInput(rate > 1.5 ? rate : Math.round(rate * 100));
            }
          }),
        );
      }

      await Promise.all(requests);
      await refreshWhatsAppConnection();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    const id = params?.id;
    if (!id) return;
    apiRequest<WorkOrder>(`/work-orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (data) => {
        setOrder(data);
        setGeneralDiscount(Number(data.discountAmount || 0));
        const statusList = await apiRequest<WorkOrderStatus[]>('/work-order-statuses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatuses(statusList);
        const currentStatus = statusList.find((s) => s.id === data.statusId) || null;
        setStatus(currentStatus);
        setStatusSelection(currentStatus?.id || data.statusId);
        setStatusAreaSelection(normalizeArea(data.orderType || currentStatus?.name || 'entrada'));
        const customerData = await apiRequest<Customer>(`/customers/${data.customerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomer(customerData);
        if (data.assetId) {
          const assetData = await apiRequest<Asset>(`/assets/${data.assetId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAsset(assetData);
        }
        if (data.branchId) {
          const branchData = await apiRequest<Branch>(`/branches/${data.branchId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBranch(branchData);
          const rate = Number(branchData?.settings?.taxRate);
          if (Number.isFinite(rate) && rate > 0) {
            setTaxRateInput(rate > 1.5 ? rate : Math.round(rate * 100));
          }
        }
      })
      .catch(() => {
        setOrder(null);
      });
    apiRequest<Product[]>('/products', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setProducts);
    apiRequest<Service[]>('/services', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setServices);
  }, [params?.id, router, token]);

  useEffect(() => {
    if (!order || showStatusModal) return;
    setStatusSelection(order.statusId);
    setStatusAreaSelection(normalizeArea(order.orderType || status?.name || 'entrada'));
  }, [order?.id, order?.statusId, order?.orderType, status?.id, showStatusModal]);

  useEffect(() => {
    if (!order?.id || !token) return;
    setAttachmentsLoading(true);
    apiRequest<Attachment[]>(
      `/files?entityType=work_order&entityId=${encodeURIComponent(order.id)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then(setAttachments)
      .finally(() => setAttachmentsLoading(false));
  }, [order?.id, token]);

  useEffect(() => {
    if (!order?.id || !token) return;
    setCommentsLoading(true);
    apiRequest<WorkOrderComment[]>(`/work-orders/${order.id}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setComments)
      .finally(() => setCommentsLoading(false));
  }, [order?.id, token]);

  useEffect(() => {
    if (!order?.id || !token) return;
    setTasksLoading(true);
    apiRequest<WorkOrderTask[]>(`/work-orders/${order.id}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setTasks)
      .finally(() => setTasksLoading(false));
  }, [order?.id, token]);

  useEffect(() => {
    if (!order?.id || !token) return;
    setItemsLoading(true);
    apiRequest<WorkOrderItem[]>(`/work-orders/${order.id}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setItems)
      .finally(() => setItemsLoading(false));
  }, [order?.id, token]);

  useEffect(() => {
    if (!token) return;
    setWhatsappConnection('loading');
    refreshWhatsAppConnection();
  }, [token]);

  useEffect(() => {
    const shouldPrint = searchParams?.get('print') === '1';
    if (shouldPrint) {
      setTimeout(() => window.print(), 400);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!openItemMenuId) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-item-menu-trigger="true"]')) return;
      if (target.closest('[data-item-menu-root="true"]')) return;
      setOpenItemMenuId(null);
      setItemMenuPosition(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenItemMenuId(null);
      setItemMenuPosition(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openItemMenuId]);

  const customerName = useMemo(() => {
    if (!customer) return '—';
    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
    return fullName || customer.legalName || '—';
  }, [customer]);

  const assetLabel = useMemo(() => {
    if (!asset) return 'Sin equipo cargado';
    return [asset.brand, asset.model].filter(Boolean).join(', ') || 'Equipo sin modelo';
  }, [asset]);

  const subtotal = items.reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
  const canEditQuote = !order?.quoteApproved;
  const effectiveDiscount = Number(order?.discountAmount ?? generalDiscount ?? 0);
  const netoSinIva = subtotal;
  const taxable = Math.max(0, subtotal - effectiveDiscount);
  const ivaAmount = Number.isFinite(Number(order?.taxAmount))
    ? Number(order?.taxAmount)
    : 0;
  const totalWithIva = Number.isFinite(Number(order?.totalAmount))
    ? Number(order?.totalAmount)
    : taxable + ivaAmount;
  const taxRateDisplay = taxable > 0 ? Math.round((ivaAmount / taxable) * 100) : 0;
  const additionalTotalAmount = Math.round(
    Number(additionalNetAmount || 0) * (1 + Number(additionalIvaPercent || 0) / 100),
  );
  const activeMenuItem = useMemo(
    () => items.find((item) => item.id === openItemMenuId) || null,
    [items, openItemMenuId],
  );
  const whatsappBadge =
    whatsappConnection === 'connected'
      ? {
          text: 'WhatsApp conectado',
          className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        }
      : whatsappConnection === 'loading'
      ? {
          text: 'WhatsApp verificando...',
          className: 'border-gray-200 bg-gray-50 text-gray-500',
        }
      : whatsappConnection === 'error'
      ? {
          text: 'WhatsApp sin verificar',
          className: 'border-amber-200 bg-amber-50 text-amber-700',
        }
      : {
          text: 'WhatsApp desconectado',
          className: 'border-rose-200 bg-rose-50 text-rose-700',
        };

  const beginEditDetail = (field: 'trabajo' | 'estado' | 'accesorios') => {
    if (!order) return;
    const value =
      field === 'trabajo'
        ? order.initialDiagnosis || ''
        : field === 'estado'
        ? order.technicalDiagnosis || ''
        : order.clientNotes || '';
    setEditingDetailField(field);
    setDetailDraft(value);
  };

  const saveDetail = async () => {
    if (!order?.id || !token || !editingDetailField) return;
    const payload =
      editingDetailField === 'trabajo'
        ? { initialDiagnosis: detailDraft.trim() }
        : editingDetailField === 'estado'
        ? { technicalDiagnosis: detailDraft.trim() }
        : { clientNotes: detailDraft.trim() };
    const updated = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    setOrder(updated);
    setEditingDetailField(null);
    setDetailDraft('');
  };

  const noteComments = comments.filter((c) => !c.content.startsWith('[DX]'));
  const diagnosticComments = comments
    .filter((c) => c.content.startsWith('[DX]'))
    .map((c) => ({ ...c, content: c.content.replace(/^\[DX\]\s*/, '') }));

  const orderArea = normalizeArea(order?.orderType || 'entrada');
  const areaLabel = STATUS_LABELS[orderArea] || 'Entrada';
  const effectiveStatusCode = inferStatusCodeForArea(order, status, orderArea);
  const statusLabel = statusLabelFromCode(orderArea, effectiveStatusCode);
  const allowedStatuses = useMemo(() => {
    const allowedNames = STATUS_OPTIONS_BY_AREA[statusAreaSelection] || [];
    const allowedCodes = (STATUS_CODES_BY_AREA[statusAreaSelection] || []).map((c) => normalizeText(c));
    return statuses.filter((s) => {
      const code = normalizeText(s.code || '');
      const name = normalizeText(s.name);
      return (
        (code && allowedCodes.includes(code)) ||
        allowedNames.some((label) => normalizeText(label) === name)
      );
    });
  }, [statuses, statusAreaSelection]);

  useEffect(() => {
    if (!showStatusModal) return;
    if (!allowedStatuses.length) return;
    const exists = allowedStatuses.some((s) => s.id === statusSelection);
    if (!exists) setStatusSelection(allowedStatuses[0].id);
  }, [showStatusModal, allowedStatuses, statusSelection]);

  const formatMoney = (value?: number | null) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const registerSystemComment = async (content: string) => {
    if (!order?.id || !token) return;
    await apiRequest(`/work-orders/${order.id}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        content,
        isInternal: false,
      }),
    });
  };

  const requestApproval = async () => {
    if (!order?.id || !token) return;
    const message = `[APROBACION_SOLICITADA] Total ${formatMoney(totalWithIva)} | Fecha ${new Date().toLocaleString(
      'es-CL',
    )}`;
    await registerSystemComment(message);
    const refreshedComments = await apiRequest<WorkOrderComment[]>(
      `/work-orders/${order.id}/comments`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setComments(refreshedComments);
    setUiNotice({ type: 'success', message: 'Solicitud de aprobación registrada en la orden.' });
  };

  const submitApprovalResponse = async () => {
    if (!order?.id || !token) return;
    const approved = approvalDecision === 'approved';
    const updatedOrder = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quoteApproved: approved }),
    });
    setOrder(updatedOrder);
    const note = approvalResponseNote.trim();
    await registerSystemComment(
      `[APROBACION_RESPUESTA] ${approved ? 'APROBADA' : 'RECHAZADA'}${note ? ` | ${note}` : ''}`,
    );
    const refreshedComments = await apiRequest<WorkOrderComment[]>(
      `/work-orders/${order.id}/comments`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setComments(refreshedComments);
    setShowApprovalResponseModal(false);
    setApprovalResponseNote('');
    setApprovalDecision('approved');
  };

  const openProvisionalPrint = () => {
    if (!order?.id) return;
    const url = `${window.location.origin}/ordenes/${order.id}?print=1&mode=provisional`;
    const win = window.open(url, '_blank');
    if (!win) {
      window.location.href = url;
      return;
    }
    setTimeout(() => win.print(), 900);
  };

  const getPublicOrderUrl = () => {
    if (!order?.orderNumber || typeof window === 'undefined') return '';
    return `${window.location.origin}/consulta/orden/${encodeURIComponent(order.orderNumber)}`;
  };

  const openPublicOrderLink = () => {
    if (!order?.orderNumber) return;
    const publicUrl = getPublicOrderUrl();
    const customerNameSafe = customerName === '—' ? 'cliente' : customerName;
    setDigitalMessage(
      `Hola ${customerNameSafe}, aquí puedes revisar tu orden digital: ${publicUrl}`,
    );
    setShowDigitalOrderModal(true);
  };

  const openHistory = () => {
    setActiveTab('notas');
    requestAnimationFrame(() => {
      const el = document.getElementById('order-tabs-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openMove = () => {
    if (order) {
      setStatusAreaSelection(normalizeArea(order.orderType || status?.name || 'entrada'));
      setStatusSelection(order.statusId);
    }
    setShowStatusModal(true);
  };

  const toggleItemVisibility = async (item: WorkOrderItem) => {
    if (!order?.id || !token || !canEditQuote) return;

    const hiddenMeta = getHiddenMeta(item.description);
    const isHidden = Boolean(hiddenMeta);

    if (isHidden) {
      try {
        const restoredUnitPrice = hiddenMeta?.unitPrice ?? Number(item.unitPrice || 0);
        const restoredDiscount = hiddenMeta?.discountPercent ?? 0;
        await apiRequest<WorkOrderItem>(`/work-orders/${order.id}/items/${item.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            description: stripHiddenMeta(item.description || ''),
            unitPrice: restoredUnitPrice,
            discountPercent: restoredDiscount,
          }),
        });

        const [refreshedItems, refreshedOrder] = await Promise.all([
          apiRequest<WorkOrderItem[]>(`/work-orders/${order.id}/items`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setItems(refreshedItems);
        setOrder(refreshedOrder);
      } catch (err: any) {
        setUiNotice({ type: 'error', message: err?.message || 'No se pudo restaurar el ítem.' });
      }
      return;
    }

    setHideItemTarget(item);
    setHideAddCustomItem(false);
    setShowHideItemModal(true);
  };

  const openEditItemMenuAction = (item: WorkOrderItem) => {
    if (!canEditQuote) return;
    setEditingItemId(item.id);
    setEditingItemDraft({
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountPercent: Number(item.discountPercent || 0),
      description: item.description || '',
    });
    setOpenItemMenuId(null);
    setItemMenuPosition(null);
  };

  const deleteItemMenuAction = async (item: WorkOrderItem) => {
    if (!order?.id || !token || !canEditQuote) return;
    await apiRequest(`/work-orders/${order.id}/items/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const refreshed = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setOrder(refreshed);
    setOpenItemMenuId(null);
    setItemMenuPosition(null);
  };

  const previewDigitalOrder = () => {
    const url = getPublicOrderUrl();
    if (!url) return;
    window.open(url, '_blank');
  };

  const copyDigitalOrderUrl = async () => {
    const url = getPublicOrderUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setUiNotice({ type: 'success', message: 'URL copiada al portapapeles.' });
    } catch {
      setUiNotice({ type: 'error', message: `No se pudo copiar automáticamente. ${url}` });
    }
  };

  const sendDigitalOrder = async () => {
    const channels: string[] = [];
    if (sendByEmail) channels.push('Correo');
    if (sendBySms) channels.push('SMS');
    if (sendByWhatsapp) channels.push('Whatsapp');
    if (!channels.length) {
      setUiNotice({ type: 'error', message: 'Selecciona al menos un canal para enviar.' });
      return;
    }

    if (!token || !order?.id) return;
    const normalizedChannels: Array<'email' | 'sms' | 'whatsapp'> = [];
    if (sendByEmail) normalizedChannels.push('email');
    if (sendBySms) normalizedChannels.push('sms');
    if (sendByWhatsapp) normalizedChannels.push('whatsapp');

    const orderUrl = getPublicOrderUrl();
    const toPhone = (customer?.phone || '').replace(/[^\d+]/g, '');
    const toEmail = customer?.email || '';

    try {
      const response = await apiRequest<{ ok: boolean; results: Array<{ channel: string; status: string; detail?: string }> }>(
        '/integrations/messaging/send-order-link',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            orderId: order.id,
            orderUrl,
            message: digitalMessage,
            toPhone,
            toEmail,
            channels: normalizedChannels,
          }),
        },
      );

      const notSent = response.results.filter((r) => r.status !== 'sent');
      if (!notSent.length) {
        setUiNotice({ type: 'success', message: `Envío exitoso por: ${channels.join(', ')}.` });
        setShowDigitalOrderModal(false);
        return;
      }

      for (const item of notSent) {
        if (item.channel === 'email' && toEmail) {
          const subject = encodeURIComponent(`Orden digital #${order.orderNumber}`);
          const body = encodeURIComponent(digitalMessage || `Revisa tu orden: ${orderUrl}`);
          window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`, '_blank');
        }
        if (item.channel === 'sms' && toPhone) {
          const body = encodeURIComponent(digitalMessage || `Revisa tu orden: ${orderUrl}`);
          window.open(`sms:${toPhone}?body=${body}`, '_blank');
        }
        if (item.channel === 'whatsapp' && toPhone) {
          const text = encodeURIComponent(digitalMessage || `Revisa tu orden: ${orderUrl}`);
          window.open(`https://wa.me/${toPhone.replace(/[^\d]/g, '')}?text=${text}`, '_blank');
        }
      }

      const details = notSent
        .map((r) => `${r.channel}: ${r.detail || r.status}`)
        .join('\n');
      setUiNotice({ type: 'error', message: `Algunos canales quedaron en modo manual. ${details}` });
    } catch (error: any) {
      setUiNotice({ type: 'error', message: error?.message || 'No se pudo procesar el envío.' });
    }
  };

  return (
    <main className="flex min-h-screen bg-cream text-ink">
      <style jsx global>{`
        .print-only {
          display: none;
        }
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            background: white !important;
          }
          nav, aside, header, .no-print, .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-block {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
      <section className="print-only">
        <div className="mx-auto w-full max-w-[780px] text-[12px] text-gray-800">
          <div className="mb-4 border-b border-gray-300 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-black">Informe de trabajo</h1>
                <p className="mt-1 text-[11px] text-gray-600">{branch?.name || 'TallerHub'}</p>
              </div>
              <div className="text-right text-[11px]">
                <p>
                  <span className="font-semibold">Orden Nº:</span> {formatOrderNumber(order?.orderNumber)}
                </p>
                <p>
                  <span className="font-semibold">Fecha:</span> {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-300 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Cliente</p>
              <p className="font-semibold">{customerName}</p>
              <p>RUT/DNI: {customer?.taxId || '—'}</p>
              <p>Teléfono: {customer?.phone || '—'}</p>
              <p>Email: {customer?.email || '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-300 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Equipo</p>
              <p className="font-semibold">{assetLabel}</p>
              <p>Tipo: {asset?.assetType || '—'}</p>
              <p>Serie: {asset?.serialNumber || '—'}</p>
              <p>Área / Estado: {areaLabel} / {statusLabel}</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-gray-300 p-3">
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-semibold">Responsable:</span> {extractResponsable(order?.internalNotes)}</p>
              <p><span className="font-semibold">Prioridad:</span> {order?.priority || 'media'}</p>
              <p><span className="font-semibold">Ingresado:</span> {formatDate(order?.createdAt || null)}</p>
              <p><span className="font-semibold">Fecha prometida:</span> {formatDate(order?.promisedAt || null)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-gray-300 p-3 leading-6">
            <p><span className="font-semibold">Trabajo:</span> {order?.initialDiagnosis || 'Sin información.'}</p>
            <p><span className="font-semibold">Descripción del estado:</span> {order?.technicalDiagnosis || 'Sin información.'}</p>
            <p><span className="font-semibold">Accesorios:</span> {order?.clientNotes || 'Sin datos.'}</p>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-gray-300">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2">Descripción</th>
                  <th className="px-2 py-2 text-right">P.Unit.</th>
                  <th className="px-2 py-2 text-right">Cant.</th>
                  <th className="px-2 py-2 text-right">Desc%</th>
                  <th className="px-2 py-2 text-right">IVA%</th>
                  <th className="px-2 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="px-2 py-2">
                      {item.itemType === 'product'
                        ? 'Producto'
                        : item.itemType === 'service'
                        ? 'Servicio'
                        : 'Adicional'}
                    </td>
                    <td className="px-2 py-2">{item.description || '—'}</td>
                    <td className="px-2 py-2 text-right">{formatMoney(item.unitPrice)}</td>
                    <td className="px-2 py-2 text-right">{item.quantity}</td>
                    <td className="px-2 py-2 text-right">{Number(item.discountPercent || 0).toFixed(0)}</td>
                    <td className="px-2 py-2 text-right">{taxRateDisplay}</td>
                    <td className="px-2 py-2 text-right">{formatMoney(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-300 p-3">
              <p className="flex items-center justify-between"><span>Neto S/IVA</span><span className="font-semibold">{formatMoney(netoSinIva)}</span></p>
              <p className="mt-1 flex items-center justify-between"><span>Desc. General</span><span className="font-semibold">{formatMoney(effectiveDiscount)}</span></p>
              <p className="mt-1 flex items-center justify-between"><span>IVA</span><span className="font-semibold">{formatMoney(ivaAmount)}</span></p>
            </div>
            <div className="rounded-lg border border-gray-300 p-3">
              <p className="flex items-center justify-between text-base font-semibold"><span>Total</span><span>{formatMoney(totalWithIva)}</span></p>
            </div>
          </div>

          {noteComments.length > 0 ? (
            <div className="mt-3 rounded-lg border border-gray-300 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Notas</p>
              <ul className="space-y-1 text-[11px]">
                {noteComments.slice(0, 6).map((c) => (
                  <li key={c.id}>• {c.content}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-8 text-center text-[11px] text-gray-600">
            <div>
              <div className="h-12" />
              <div className="border-t border-gray-400 pt-1">Firma cliente</div>
            </div>
            <div>
              <div className="h-12" />
              <div className="border-t border-gray-400 pt-1">Firma técnico / responsable</div>
            </div>
          </div>
        </div>
      </section>
      <div className="screen-only contents">
      <Sidebar />
      <div className="flex-1 px-8 py-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Orden de trabajo</h1>
            <div className="mt-1 text-sm text-gray-500">
              Principal <span className="mx-2">›</span> Taller <span className="mx-2">›</span> Órdenes
              <span className="mx-2">›</span>
              <span className="text-brand">Orden Nº {formatOrderNumber(order?.orderNumber)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              className="rounded-full border border-gray-200 px-3 py-2 hover:bg-white"
              onClick={() => router.back()}
            >
              ←
            </button>
            <button
              className="rounded-full border border-gray-200 px-3 py-2 hover:bg-white"
              onClick={() => window.print()}
            >
              🖨
            </button>
            <button
              className="rounded-full border border-gray-200 px-3 py-2 hover:bg-white"
              onClick={openPublicOrderLink}
            >
              🔗
            </button>
            <button
              className="rounded-full border border-gray-200 px-4 py-2 hover:bg-white"
              onClick={openHistory}
            >
              Historial
            </button>
            <button
              className="rounded-full border border-gray-200 px-4 py-2 hover:bg-white"
              onClick={openMove}
            >
              Mover
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl border border-dashed border-gray-200 bg-sand/40 flex items-center justify-center text-gray-400">
                👤
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center rounded-full bg-sand px-3 py-1 text-xs text-gray-600">
                  {customer?.taxId || 'Persona'}
                </div>
                <div className="mt-2 text-lg font-semibold">{customerName}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {customer?.email || 'No cargado'}
                </div>
                <div className="mt-1 text-sm text-gray-500">{customer?.phone || '—'}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <button className="rounded-full border border-gray-200 px-2 py-1">👁</button>
                <button className="rounded-full border border-gray-200 px-2 py-1">✎</button>
                <button className="rounded-full border border-gray-200 px-2 py-1">⋮</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl border border-dashed border-gray-200 bg-sand/40 flex items-center justify-center text-gray-400">
                🔧
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center rounded-full bg-sand px-3 py-1 text-xs text-gray-600">
                  {asset?.assetType || 'Equipo'}
                </div>
                <div className="mt-2 text-lg font-semibold">{assetLabel}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {asset?.serialNumber || 'Genérico'}
                </div>
                <div className="mt-1 text-sm text-gray-500">{asset ? 'Cargado' : 'No cargado'}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <button className="rounded-full border border-gray-200 px-2 py-1">🔍</button>
                <button className="rounded-full border border-gray-200 px-2 py-1">✎</button>
                <button className="rounded-full border border-gray-200 px-2 py-1">⋮</button>
              </div>
            </div>
          </div>
        </div>

        <div id="order-tabs-section" className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold">Orden #{formatOrderNumber(order?.orderNumber)}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>SMS Entrada</span>
              <span>SMS Salida</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${whatsappBadge.className}`}>
                {whatsappBadge.text}
              </span>
              <span>✉ Entrada</span>
              <span>✉ Salida</span>
              <span className="rounded-full border border-gray-200 px-3 py-1">0</span>
              <button
                className="rounded-full border border-gray-200 px-3 py-1 disabled:opacity-60"
                onClick={refreshOrderData}
                disabled={refreshing}
              >
                {refreshing ? '…' : '↻'}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 text-sm">
              <p className="text-gray-500">
                <span className="font-semibold text-ink">Responsable:</span> {extractResponsable(order?.internalNotes)}
              </p>
              <p className="mt-2 text-gray-500">
                <span className="font-semibold text-ink">Ingresado:</span> {formatDate(order?.createdAt || null)}
              </p>
              <p className="mt-2 text-gray-500">
                <span className="font-semibold text-ink">Fecha prometida:</span>{' '}
                {formatDate(order?.promisedAt || null)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Garantía</span>
                <div className="h-6 w-12 rounded-full bg-gray-200" />
              </div>
              <p className="mt-2 text-gray-500">
                <span className="font-semibold text-ink">Presupuesto:</span>{' '}
                {Number.isFinite(Number(order?.totalAmount ?? 0))
                  ? `$${Number(order?.totalAmount ?? 0).toFixed(0)}`
                  : '$0'}
              </p>
              <p className="mt-2 text-gray-500">
                <span className="font-semibold text-ink">Adelanto:</span> $0
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 p-4 text-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <span className="font-semibold text-ink">Trabajo:</span>{' '}
                {editingDetailField === 'trabajo' ? (
                  <textarea
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    rows={3}
                    value={detailDraft}
                    onChange={(e) => setDetailDraft(e.target.value)}
                  />
                ) : (
                  <span className="text-gray-600">{order?.initialDiagnosis || 'Sin información.'}</span>
                )}
              </div>
              {editingDetailField === 'trabajo' ? (
                <div className="flex flex-col gap-2">
                  <button className="rounded-full border border-gray-200 px-3 py-1 text-xs" onClick={() => {
                    setEditingDetailField(null);
                    setDetailDraft('');
                  }}>
                    Cancelar
                  </button>
                  <button className="rounded-full bg-brand px-3 py-1 text-xs text-white" onClick={saveDetail}>
                    Guardar
                  </button>
                </div>
              ) : (
                <button className="rounded-full border border-gray-200 px-3 py-1 text-xs" onClick={() => beginEditDetail('trabajo')}>
                  Editar
                </button>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <span className="font-semibold text-ink">Descripción del estado:</span>{' '}
                {editingDetailField === 'estado' ? (
                  <textarea
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    rows={3}
                    value={detailDraft}
                    onChange={(e) => setDetailDraft(e.target.value)}
                  />
                ) : (
                  <span className="text-gray-600">{order?.technicalDiagnosis || 'Sin información.'}</span>
                )}
              </div>
              {editingDetailField === 'estado' ? (
                <div className="flex flex-col gap-2">
                  <button className="rounded-full border border-gray-200 px-3 py-1 text-xs" onClick={() => {
                    setEditingDetailField(null);
                    setDetailDraft('');
                  }}>
                    Cancelar
                  </button>
                  <button className="rounded-full bg-brand px-3 py-1 text-xs text-white" onClick={saveDetail}>
                    Guardar
                  </button>
                </div>
              ) : (
                <button className="rounded-full border border-gray-200 px-3 py-1 text-xs" onClick={() => beginEditDetail('estado')}>
                  Editar
                </button>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <span className="font-semibold text-ink">Accesorios:</span>{' '}
                {editingDetailField === 'accesorios' ? (
                  <textarea
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    rows={2}
                    value={detailDraft}
                    onChange={(e) => setDetailDraft(e.target.value)}
                  />
                ) : (
                  <span className="text-gray-600">{order?.clientNotes || 'Sin datos'}</span>
                )}
              </div>
              {editingDetailField === 'accesorios' ? (
                <div className="flex flex-col gap-2">
                  <button className="rounded-full border border-gray-200 px-3 py-1 text-xs" onClick={() => {
                    setEditingDetailField(null);
                    setDetailDraft('');
                  }}>
                    Cancelar
                  </button>
                  <button className="rounded-full bg-brand px-3 py-1 text-xs text-white" onClick={saveDetail}>
                    Guardar
                  </button>
                </div>
              ) : (
                <button className="rounded-full border border-gray-200 px-3 py-1 text-xs" onClick={() => beginEditDetail('accesorios')}>
                  Editar
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-brand px-4 py-2 text-white">{areaLabel}</span>
            <span className="rounded-full bg-sand px-4 py-2 text-gray-700">{statusLabel}</span>
            <button
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-sand"
              onClick={() => setShowStatusModal(true)}
            >
              Cambiar estado
            </button>
            <span className="ml-2 text-xs text-gray-500">
              Último cambio de estado: {formatDate(order?.updatedAt || null)}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Productos y servicios</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                className={`rounded-2xl border px-4 py-2 font-medium ${
                  order?.quoteApproved
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
                onClick={async () => {
                  if (!order?.id || !token) return;
                  const updated = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ quoteApproved: !order.quoteApproved }),
                  });
                  setOrder(updated);
                }}
              >
                {order?.quoteApproved ? '🔒 Aprobado' : 'Pendiente'}
              </button>
              <button className="h-11 w-11 rounded-2xl border border-gray-200 bg-sand/50 text-gray-600">i</button>
              <button
                className="h-11 w-11 rounded-2xl border border-gray-200 bg-sand/50 text-gray-600"
                onClick={() => window.print()}
              >
                🖨
              </button>
              <button
                className="h-11 w-11 rounded-2xl border border-gray-200 bg-sand/50 text-gray-600"
                onClick={() => setShowTaxModal(true)}
                title="IVA por sucursal"
              >
                %
              </button>
              <button
                className={`rounded-2xl border border-gray-200 px-5 py-2 ${itemType === 'product' ? 'bg-sand' : 'bg-sand/40'}`}
                onClick={() => {
                  setItemType('product');
                  setShowItemComposer(true);
                }}
              >
                + Producto
              </button>
              <button
                className={`rounded-2xl border border-gray-200 px-5 py-2 ${itemType === 'service' ? 'bg-sand' : 'bg-sand/40'}`}
                onClick={() => {
                  setItemType('service');
                  setShowItemComposer(true);
                }}
              >
                + Servicio
              </button>
              <button
                className={`rounded-2xl border border-gray-200 px-5 py-2 ${itemType === 'additional' ? 'bg-sand' : 'bg-sand/40'}`}
                onClick={() => {
                  setItemType('additional');
                  setAdditionalKind('product');
                  setAdditionalDescription('');
                  setAdditionalNetAmount(0);
                  setAdditionalIvaPercent(0);
                  setShowAdditionalModal(true);
                }}
              >
                + Adicional
              </button>
              <button
                className="rounded-2xl bg-brand px-5 py-2 text-white"
                onClick={openProvisionalPrint}
              >
                ↻ Provisional
              </button>
            </div>
          </div>
          {order?.quoteApproved ? (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-800">
              Presupuesto aprobado: edición de ítems, descuento e IVA bloqueada.
            </div>
          ) : null}
          <div className="mt-4 space-y-4">
            {showItemComposer ? (
            <div className="rounded-xl border border-gray-200 bg-sand/20 p-3">
            <div className="grid gap-3 md:grid-cols-6">
              {itemType === 'product' ? (
                <select
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={itemProductId}
                  onChange={(e) => {
                    setItemProductId(e.target.value);
                    const found = products.find((p) => p.id === e.target.value);
                    if (found) {
                      setItemUnitPrice(Number(found.unitPrice || 0));
                      setItemUnitCost(Number(found.unitCost || 0));
                      setItemDescription(found.name);
                    }
                  }}
                >
                  <option value="">Seleccionar producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : itemType === 'service' ? (
                <select
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={itemServiceId}
                  onChange={(e) => {
                    setItemServiceId(e.target.value);
                    const found = services.find((s) => s.id === e.target.value);
                    if (found) {
                      setItemUnitPrice(Number(found.price || 0));
                      setItemUnitCost(Number(found.cost || 0));
                      setItemDescription(found.name);
                    }
                  }}
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500">
                  Adicional (sin catálogo)
                </div>
              )}
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Descripción"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
              />
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                value={itemUnitPrice}
                onChange={(e) => setItemUnitPrice(Number(e.target.value))}
              />
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                value={itemDiscount}
                onChange={(e) => setItemDiscount(Number(e.target.value))}
                placeholder="% Desc."
              />
            </div>
            <div className="flex items-center justify-end">
              <button
                className="mr-2 rounded-full border border-gray-200 px-4 py-2 text-sm"
                onClick={() => setShowItemComposer(false)}
              >
                Cerrar
              </button>
              <button
                className="rounded-full bg-brand px-4 py-2 text-sm text-white disabled:bg-gray-300"
                disabled={!canEditQuote || savingItem}
                onClick={async () => {
                  if (!order?.id || !token) return;
                  if (!canEditQuote) return;
                  if (itemType === 'product' && !itemProductId && !itemDescription.trim()) return;
                  if (itemType === 'service' && !itemServiceId && !itemDescription.trim()) return;
                  if (itemType === 'additional' && !itemDescription.trim()) return;
                  setSavingItem(true);
                  try {
                    const created = await apiRequest<WorkOrderItem>(`/work-orders/${order.id}/items`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        itemType,
                        productId: itemProductId || undefined,
                        serviceId: itemServiceId || undefined,
                        description: itemDescription || undefined,
                        quantity: itemQuantity,
                        unitCost: itemUnitCost,
                        unitPrice: itemUnitPrice,
                        discountPercent: itemDiscount,
                      }),
                    });
                    setItems((prev) => [...prev, created]);
                    const refreshed = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setOrder(refreshed);
                    setItemProductId('');
                    setItemServiceId('');
                    setItemDescription('');
                    setItemQuantity(1);
                    setItemDiscount(0);
                  } catch (err: any) {
                    setUiNotice({ type: 'error', message: err?.message || 'No se pudo agregar el ítem.' });
                  } finally {
                    setSavingItem(false);
                  }
                }}
              >
                {savingItem ? 'Guardando...' : 'Agregar ítem'}
              </button>
            </div>
            </div>
            ) : null}

            {itemsLoading ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                Cargando ítems...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                Aún no tienes productos o servicios en esta orden de trabajo.
                <div className="mt-1 text-gray-400">Agregá ítems para calcular el total.</div>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-visible rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-sand/40 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 w-10"></th>
                      <th className="px-3 py-2 w-24"></th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-right">P.Unitario</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-right">(%)Desc.</th>
                      <th className="px-3 py-2 text-right">IVA(%)</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const isEditing = editingItemId === item.id;
                      const isItemHidden = Boolean(getHiddenMeta(item.description));
                      return (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <input type="checkbox" className="h-5 w-5 rounded border-gray-300" />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2 text-gray-500">
                              <button
                                className="h-7 w-7 rounded-full bg-sand/80"
                                title={isItemHidden ? 'Volver a mostrar ítem' : 'Ocultar ítem'}
                                onClick={() => toggleItemVisibility(item)}
                              >
                                {isItemHidden ? '🙈' : '👁'}
                              </button>
                              <button
                                className="h-7 w-7 rounded-full bg-sand/80"
                                title="Notas"
                                onClick={() => {
                                  setItemNoteItem(item);
                                  setItemNoteText('');
                                  setShowItemNoteModal(true);
                                }}
                              >
                                💬
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {item.itemType === 'product'
                              ? 'Producto'
                              : item.itemType === 'service'
                              ? 'Servicio'
                              : parseAdditionalDescription(item.description).kind === 'service'
                              ? 'Adic.Serv.'
                              : 'Adic.Prod.'}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
                                value={editingItemDraft?.description || ''}
                                onChange={(e) =>
                                  setEditingItemDraft((prev) =>
                                    prev ? { ...prev, description: e.target.value } : prev,
                                  )
                                }
                              />
                            ) : (
                              parseAdditionalDescription(item.description).text || '—'
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <input
                                className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right text-sm"
                                type="number"
                                min="0"
                                value={editingItemDraft?.unitPrice ?? item.unitPrice}
                                onChange={(e) =>
                                  setEditingItemDraft((prev) =>
                                    prev ? { ...prev, unitPrice: Number(e.target.value) } : prev,
                                  )
                                }
                              />
                            ) : (
                              `$${Number(item.unitPrice || 0).toFixed(0)}`
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <input
                                className="w-16 rounded-md border border-gray-200 px-2 py-1 text-right text-sm"
                                type="number"
                                min="1"
                                value={editingItemDraft?.quantity ?? item.quantity}
                                onChange={(e) =>
                                  setEditingItemDraft((prev) =>
                                    prev ? { ...prev, quantity: Number(e.target.value) } : prev,
                                  )
                                }
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <input
                                className="w-16 rounded-md border border-gray-200 px-2 py-1 text-right text-sm"
                                type="number"
                                min="0"
                                value={editingItemDraft?.discountPercent ?? Number(item.discountPercent || 0)}
                                onChange={(e) =>
                                  setEditingItemDraft((prev) =>
                                    prev ? { ...prev, discountPercent: Number(e.target.value) } : prev,
                                  )
                                }
                              />
                            ) : (
                              Number(item.discountPercent || 0).toFixed(0)
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">{taxRateDisplay}</td>
                          <td className="px-3 py-2 text-right">{formatMoney(item.totalPrice || 0)}</td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  className="text-xs text-gray-500"
                                  onClick={() => {
                                    setEditingItemId(null);
                                    setEditingItemDraft(null);
                                  }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className="text-xs text-brand disabled:text-gray-400"
                                  disabled={!canEditQuote}
                                  onClick={async () => {
                                    if (!order?.id || !token || !editingItemDraft) return;
                                    if (!canEditQuote) return;
                                    const updated = await apiRequest<WorkOrderItem>(
                                      `/work-orders/${order.id}/items/${item.id}`,
                                      {
                                        method: 'PATCH',
                                        headers: { Authorization: `Bearer ${token}` },
                                        body: JSON.stringify(editingItemDraft),
                                      },
                                    );
                                    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
                                    const refreshed = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
                                    setOrder(refreshed);
                                    setEditingItemId(null);
                                    setEditingItemDraft(null);
                                  }}
                                >
                                  Guardar
                                </button>
                              </div>
                            ) : (
                              <div className="inline-block">
                                <button
                                  data-item-menu-trigger="true"
                                  className="h-11 w-11 rounded-2xl bg-sand/60 text-lg text-gray-600"
                                  onClick={(event) => {
                                    const isSameItem = openItemMenuId === item.id;
                                    if (isSameItem) {
                                      setOpenItemMenuId(null);
                                      setItemMenuPosition(null);
                                      return;
                                    }

                                    const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                    const menuWidth = 160;
                                    const viewportWidth = window.innerWidth;
                                    const left = Math.max(
                                      8,
                                      Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8),
                                    );
                                    const openUp = index >= items.length - 2;
                                    const top = openUp ? rect.top - 8 : rect.bottom + 8;

                                    setOpenItemMenuId(item.id);
                                    setItemMenuPosition({
                                      id: item.id,
                                      top,
                                      left,
                                      openUp,
                                    });
                                  }}
                                >
                                  ⋮
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {openItemMenuId && itemMenuPosition && activeMenuItem && typeof document !== 'undefined'
            ? createPortal(
                <div
                  ref={itemMenuRef}
                  data-item-menu-root="true"
                  className={`fixed z-[120] w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg ${
                    itemMenuPosition.openUp ? '-translate-y-full' : ''
                  }`}
                  style={{ top: itemMenuPosition.top, left: itemMenuPosition.left }}
                >
                  <button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sand"
                    disabled={!canEditQuote}
                    onClick={() => openEditItemMenuAction(activeMenuItem)}
                  >
                    Editar
                  </button>
                  <button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    disabled={!canEditQuote}
                    onClick={() => deleteItemMenuAction(activeMenuItem)}
                  >
                    Eliminar
                  </button>
                </div>,
                document.body,
              )
            : null}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Neto S/IVA</span>
                <span className="font-semibold">{formatMoney(netoSinIva)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-500">Desc.Gral.</span>
                <div className="flex items-center gap-2">
                  <input
                    className="w-24 rounded-md border border-gray-200 px-2 py-1 text-right text-sm"
                    type="number"
                    min="0"
                    value={generalDiscount}
                    disabled={!canEditQuote}
                    onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                  />
                  <button
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs disabled:text-gray-400"
                    disabled={!canEditQuote}
                    onClick={async () => {
                      if (!order?.id || !token) return;
                      if (!canEditQuote) return;
                      const updated = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ discountAmount: generalDiscount }),
                      });
                      setOrder(updated);
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-500">IVA</span>
                <span className="font-semibold">{formatMoney(ivaAmount)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal C/IVA</span>
                <span className="font-semibold">{formatMoney(totalWithIva)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(totalWithIva)}</span>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="rounded-2xl bg-sand px-4 py-2 text-sm text-gray-700"
                  onClick={requestApproval}
                >
                  Solicitar aprobación
                </button>
                <button
                  className="rounded-2xl bg-sand px-4 py-2 text-sm text-gray-700"
                  onClick={() => setShowApprovalResponseModal(true)}
                >
                  Responder
                </button>
              </div>
            </div>
          </div>
        </div>

        {showDigitalOrderModal ? (
          <div className="fixed inset-0 z-[87] flex items-center justify-center bg-black/45 px-4 py-6">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold leading-none text-ink">Orden digital</h2>
                <button
                  className="text-3xl leading-none text-gray-400 hover:text-ink"
                  onClick={() => setShowDigitalOrderModal(false)}
                >
                  ×
                </button>
              </div>

              <p className="mt-3 text-base font-semibold leading-tight text-gray-700">
                El siguiente vínculo permite a su cliente acceder a la orden en formato digital.
              </p>

              <div className="mt-4 rounded-xl border border-gray-200 p-3">
                <label className="block text-base text-gray-600">URL Orden digital</label>
                <div className="mt-3 flex overflow-hidden rounded-2xl border border-gray-200">
                  <input
                    value={getPublicOrderUrl()}
                    readOnly
                    className="h-10 flex-1 px-3 text-sm text-gray-700 outline-none"
                  />
                  <button
                    className="h-10 w-12 border-l border-gray-200 text-base text-gray-600 hover:bg-gray-50"
                    onClick={previewDigitalOrder}
                    title="Ver orden digital"
                  >
                    👁
                  </button>
                  <button
                    className="h-10 w-12 border-l border-gray-200 text-base text-gray-600 hover:bg-gray-50"
                    onClick={copyDigitalOrderUrl}
                    title="Copiar URL"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-3">
                <p className="text-base text-gray-700">Enviar orden digital vía:</p>
                <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-gray-700">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={sendByEmail}
                      onChange={(e) => setSendByEmail(e.target.checked)}
                    />
                    Correo
                  </label>
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={sendBySms}
                      onChange={(e) => setSendBySms(e.target.checked)}
                    />
                    Sms
                  </label>
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={sendByWhatsapp}
                      onChange={(e) => setSendByWhatsapp(e.target.checked)}
                    />
                    Whatsapp
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-base text-gray-700">Mensaje</label>
                <textarea
                  className="mt-2 h-28 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none"
                  value={digitalMessage}
                  onChange={(e) => setDigitalMessage(e.target.value)}
                  placeholder="Escribe el mensaje que recibirá el cliente..."
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  className="rounded-xl bg-sand px-5 py-2 text-base font-medium text-gray-700"
                  onClick={() => setShowDigitalOrderModal(false)}
                >
                  Cerrar
                </button>
                <button
                  className="rounded-xl bg-[#77C982] px-5 py-2 text-base font-semibold text-white"
                  onClick={sendDigitalOrder}
                >
                  ✉ Enviar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showAdditionalModal ? (
          <div className="fixed inset-0 z-[88] flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-ink">Creando Adicional</h2>
                <button
                  className="text-3xl leading-none text-gray-400 hover:text-ink"
                  onClick={() => setShowAdditionalModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-700">Tipo</label>
                  <select
                    className="mt-1.5 h-10 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-800"
                    value={additionalKind}
                    onChange={(e) => setAdditionalKind(e.target.value as 'product' | 'service')}
                  >
                    <option value="product">Producto</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-700">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="mt-1.5 h-10 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-800"
                    value={additionalDescription}
                    onChange={(e) => setAdditionalDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-700">Costo S/IVA</label>
                  <input
                    className="mt-1.5 h-10 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-800"
                    type="number"
                    min="0"
                    value={additionalNetAmount}
                    onChange={(e) => setAdditionalNetAmount(Number(e.target.value || 0))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Importe S/IVA</label>
                  <input
                    className="mt-1.5 h-10 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-800"
                    type="number"
                    min="0"
                    value={additionalNetAmount}
                    onChange={(e) => setAdditionalNetAmount(Number(e.target.value || 0))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">IVA</label>
                  <select
                    className="mt-1.5 h-10 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-800"
                    value={additionalIvaPercent}
                    onChange={(e) => setAdditionalIvaPercent(Number(e.target.value || 0))}
                  >
                    <option value={0}>0%</option>
                    <option value={19}>19%</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-700">Importe C/IVA</label>
                  <input
                    className="mt-1.5 h-10 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-800"
                    type="number"
                    min="0"
                    value={additionalTotalAmount}
                    readOnly
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="rounded-xl bg-sand px-4 py-2 text-sm font-medium text-gray-700"
                  onClick={() => setShowAdditionalModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
                  disabled={!canEditQuote || !additionalDescription.trim() || savingAdditional}
                  onClick={async () => {
                    if (!order?.id || !token || !canEditQuote) return;
                    setSavingAdditional(true);
                    try {
                      const prefix = ADDITIONAL_TYPE_PREFIX[additionalKind];
                      const storedDescription = `${prefix} ${additionalDescription.trim()}`.trim();
                      const created = await apiRequest<WorkOrderItem>(`/work-orders/${order.id}/items`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          itemType: 'additional',
                          description: storedDescription,
                          quantity: 1,
                          unitCost: additionalNetAmount,
                          unitPrice: additionalTotalAmount,
                          discountPercent: 0,
                        }),
                      });
                      setItems((prev) => [...prev, created]);
                      const refreshed = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setOrder(refreshed);
                      setShowAdditionalModal(false);
                    } catch (err: any) {
                      setUiNotice({ type: 'error', message: err?.message || 'No se pudo guardar el adicional.' });
                    } finally {
                      setSavingAdditional(false);
                    }
                  }}
                >
                  {savingAdditional ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showHideItemModal && hideItemTarget ? (
          <div className="fixed inset-0 z-[89] flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
              <div className="text-center">
                <h2 className="text-xl font-semibold leading-tight text-ink">
                  ¿Está seguro de querer deshabilitar como visible el siguiente ítem?
                </h2>
                <p className="mt-2 text-lg text-gray-700">
                  {parseAdditionalDescription(hideItemTarget.description).text || 'Ítem sin descripción'}
                </p>
                <p className="mt-3 text-base font-semibold leading-snug text-red-600">
                  Los productos ocultos tendrán importe $0 para no alterar la cuenta.
                  Puedes reemplazarlo por un item adicional personalizado.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-center">
                <label className="inline-flex items-center gap-3 text-base text-gray-700">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300"
                    checked={hideAddCustomItem}
                    onChange={(e) => setHideAddCustomItem(e.target.checked)}
                  />
                  Añadir item personalizado - Total: {formatMoney(Number(hideItemTarget.totalPrice || 0))}
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="rounded-2xl bg-sand px-5 py-2 text-base font-medium text-gray-700"
                  onClick={() => {
                    setShowHideItemModal(false);
                    setHideItemTarget(null);
                    setHideAddCustomItem(false);
                  }}
                  disabled={savingHideItem}
                >
                  Cancelar
                </button>
                <button
                  className="rounded-2xl bg-brand px-5 py-2 text-base font-semibold text-white disabled:bg-gray-300"
                  disabled={savingHideItem}
                  onClick={async () => {
                    if (!order?.id || !token || !hideItemTarget) return;
                    setSavingHideItem(true);
                    try {
                      const originalTotal = Number(hideItemTarget.totalPrice || 0);

                      await apiRequest<WorkOrderItem>(`/work-orders/${order.id}/items/${hideItemTarget.id}`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          description: withHiddenMeta(
                            hideItemTarget.description || '',
                            Number(hideItemTarget.unitPrice || 0),
                            Number(hideItemTarget.discountPercent || 0),
                          ),
                          unitPrice: 0,
                          discountPercent: 0,
                        }),
                      });

                      if (hideAddCustomItem && originalTotal > 0) {
                        const baseLabel =
                          parseAdditionalDescription(hideItemTarget.description).text || 'Ítem personalizado';
                        await apiRequest<WorkOrderItem>(`/work-orders/${order.id}/items`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                          body: JSON.stringify({
                            itemType: 'additional',
                            description: `[ADIC_PROD] Reemplazo por ocultar: ${baseLabel}`,
                            quantity: 1,
                            unitCost: 0,
                            unitPrice: originalTotal,
                            discountPercent: 0,
                          }),
                        });
                      }

                      const [refreshedItems, refreshedOrder] = await Promise.all([
                        apiRequest<WorkOrderItem[]>(`/work-orders/${order.id}/items`, {
                          headers: { Authorization: `Bearer ${token}` },
                        }),
                        apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        }),
                      ]);
                      setItems(refreshedItems);
                      setOrder(refreshedOrder);
                      setShowHideItemModal(false);
                      setHideItemTarget(null);
                      setHideAddCustomItem(false);
                    } catch (err: any) {
                      setUiNotice({ type: 'error', message: err?.message || 'No se pudo ocultar el ítem.' });
                    } finally {
                      setSavingHideItem(false);
                    }
                  }}
                >
                  {savingHideItem ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showItemNoteModal && itemNoteItem ? (
          <div className="fixed inset-0 z-[89] flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-ink">Notas del ítem</h2>
                <button
                  className="text-4xl leading-none text-gray-400 hover:text-ink"
                  onClick={() => {
                    setShowItemNoteModal(false);
                    setItemNoteItem(null);
                    setItemNoteText('');
                  }}
                >
                  ×
                </button>
              </div>

              <fieldset className="mt-4 rounded-2xl border border-blue-500 px-4 pb-3">
                <legend className="px-2 text-lg text-gray-700">Nota</legend>
                <textarea
                  className="h-40 w-full resize-none bg-transparent text-lg text-gray-800 outline-none"
                  placeholder=""
                  value={itemNoteText}
                  onChange={(e) => setItemNoteText(e.target.value)}
                />
              </fieldset>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="rounded-2xl bg-sand px-6 py-2 text-xl font-medium text-gray-700"
                  onClick={() => {
                    setShowItemNoteModal(false);
                    setItemNoteItem(null);
                    setItemNoteText('');
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="rounded-2xl bg-brand px-6 py-2 text-xl font-semibold text-white disabled:bg-gray-300"
                  disabled={!itemNoteText.trim() || savingItemNote}
                  onClick={async () => {
                    if (!order?.id || !token || !itemNoteItem || !itemNoteText.trim()) return;
                    setSavingItemNote(true);
                    try {
                      const created = await apiRequest<WorkOrderComment>(
                        `/work-orders/${order.id}/comments`,
                        {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                          body: JSON.stringify({
                            content: `[ITEM:${itemNoteItem.id}] ${itemNoteText.trim()}`,
                            isInternal: false,
                            kind: 'note',
                          }),
                        },
                      );
                      setComments((prev) => [created, ...prev]);
                      setActiveTab('notas');
                      setShowItemNoteModal(false);
                      setItemNoteItem(null);
                      setItemNoteText('');
                    } catch (err: any) {
                      setUiNotice({ type: 'error', message: err?.message || 'No se pudo guardar la nota del ítem.' });
                    } finally {
                      setSavingItemNote(false);
                    }
                  }}
                >
                  {savingItemNote ? 'Guardando...' : 'Guardar nota'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showApprovalResponseModal ? (
          <div className="fixed inset-0 z-[86] flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Responder aprobación</h2>
                <button
                  className="h-8 w-8 rounded-full border border-gray-200 text-gray-500 hover:text-ink"
                  onClick={() => setShowApprovalResponseModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-600">Decisión</label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={approvalDecision}
                  onChange={(e) => setApprovalDecision(e.target.value as 'approved' | 'rejected')}
                >
                  <option value="approved">Aprobar presupuesto</option>
                  <option value="rejected">Rechazar presupuesto</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-600">Nota (opcional)</label>
                <textarea
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  rows={3}
                  value={approvalResponseNote}
                  onChange={(e) => setApprovalResponseNote(e.target.value)}
                  placeholder="Ej: Aprobado por cliente vía WhatsApp"
                />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="rounded-full px-4 py-2 text-sm text-gray-600 hover:text-ink"
                  onClick={() => setShowApprovalResponseModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                  onClick={submitApprovalResponse}
                >
                  Guardar respuesta
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showStatusModal ? (
          <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Cambiar estado</h2>
                <button
                  className="h-8 w-8 rounded-full border border-gray-200 text-gray-500 hover:text-ink"
                  onClick={() => setShowStatusModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-600">Área</label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={statusAreaSelection}
                  onChange={(e) =>
                    setStatusAreaSelection(
                      e.target.value as 'entrada' | 'domicilio' | 'reparacion' | 'salida',
                    )
                  }
                >
                  <option value="entrada">Entrada</option>
                  <option value="domicilio">Domicilio</option>
                  <option value="reparacion">Reparación</option>
                  <option value="salida">Salida</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-600">Estado</label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={statusSelection}
                  onChange={(e) => setStatusSelection(e.target.value)}
                >
                  {(allowedStatuses.length ? allowedStatuses : statuses).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="rounded-full px-4 py-2 text-sm text-gray-600 hover:text-ink"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="rounded-full bg-brand px-4 py-2 text-sm text-white disabled:bg-gray-300"
                  disabled={savingStatus}
                  onClick={async () => {
                    if (!order?.id || !token || !statusSelection) return;
                    setSavingStatus(true);
                    try {
                      const updated = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          statusId: statusSelection,
                          orderType: statusAreaSelection,
                        }),
                      });
                      const selectedStatus = statuses.find((s) => s.id === statusSelection) || null;
                      setOrder(updated);
                      setStatus(selectedStatus);
                      setShowStatusModal(false);
                    } catch (err: any) {
                      setUiNotice({ type: 'error', message: err?.message || 'No se pudo cambiar el estado.' });
                    } finally {
                      setSavingStatus(false);
                    }
                  }}
                >
                  {savingStatus ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showTaxModal ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">IVA por sucursal</h2>
                <button
                  className="h-8 w-8 rounded-full border border-gray-200 text-gray-500 hover:text-ink"
                  onClick={() => setShowTaxModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-600">IVA (%)</label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  type="number"
                  min="0"
                  value={taxRateInput}
                  disabled={!canEditQuote}
                  onChange={(e) => setTaxRateInput(Number(e.target.value))}
                />
                <p className="mt-2 text-xs text-gray-400">Se guarda en la sucursal actual.</p>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="rounded-full px-4 py-2 text-sm text-gray-600 hover:text-ink"
                  onClick={() => setShowTaxModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="rounded-full bg-brand px-4 py-2 text-sm text-white disabled:bg-gray-300"
                  disabled={!canEditQuote}
                  onClick={async () => {
                    if (!order?.branchId || !token) return;
                    if (!canEditQuote) return;
                    await apiRequest(`/branches/${order.branchId}`, {
                      method: 'PATCH',
                      headers: { Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ taxRate: taxRateInput }),
                    });
                    const updatedOrder = await apiRequest<WorkOrder>(`/work-orders/${order.id}`, {
                      method: 'PATCH',
                      headers: { Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ discountAmount: order.discountAmount ?? 0 }),
                    });
                    setOrder(updatedOrder);
                    if (order.branchId) {
                      const branchData = await apiRequest<Branch>(`/branches/${order.branchId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setBranch(branchData);
                    }
                    setShowTaxModal(false);
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
            {['tareas', 'notas', 'archivos', 'diagnosticos'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`rounded-full px-4 py-2 ${
                  activeTab === tab ? 'bg-sand text-ink' : 'text-gray-500'
                }`}
              >
                {tab === 'tareas'
                  ? `Tareas (${tasks.length})`
                  : tab === 'notas'
                  ? `Notas (${noteComments.length})`
                  : tab === 'archivos'
                  ? `Archivos (${attachments.length})`
                  : `Diagnósticos (${diagnosticComments.length})`}
              </button>
            ))}
            <div className="ml-auto">
              <button className="rounded-full border border-gray-200 px-4 py-2 text-sm">+ Agregar</button>
            </div>
          </div>

          {activeTab === 'tareas' ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm"
                  placeholder="Nueva tarea"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <button
                  className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                  onClick={async () => {
                    if (!newTaskTitle.trim() || !order?.id || !token) return;
                    const created = await apiRequest<WorkOrderTask>(`/work-orders/${order.id}/tasks`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ title: newTaskTitle.trim() }),
                    });
                    setTasks((prev) => [created, ...prev]);
                    setNewTaskTitle('');
                  }}
                >
                  + Agregar
                </button>
              </div>

              {tasksLoading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  Cargando tareas...
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  Aún no tienes tareas en esta orden de trabajo.
                  <div className="mt-1 text-gray-400">Agregá una tarea para comenzar.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={async () => {
                          if (!order?.id || !token) return;
                          const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
                          const updated = await apiRequest<WorkOrderTask>(
                            `/work-orders/${order.id}/tasks/${task.id}`,
                            {
                              method: 'PATCH',
                              headers: { Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ status: nextStatus }),
                            },
                          );
                          setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
                        }}
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                      </div>
                      <button
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (!order?.id || !token) return;
                          await apiRequest(`/work-orders/${order.id}/tasks/${task.id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          setTasks((prev) => prev.filter((t) => t.id !== task.id));
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'notas' ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <textarea
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                  rows={3}
                  placeholder="Escribe una nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="flex w-full items-center justify-end gap-2">
                  <button
                    className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                    onClick={async () => {
                      if (!newNote.trim() || !order?.id || !token) return;
                      const created = await apiRequest<WorkOrderComment>(
                        `/work-orders/${order.id}/comments`,
                        {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ content: newNote.trim(), isInternal: false, kind: 'note' }),
                        },
                      );
                      setComments((prev) => [created, ...prev]);
                      setNewNote('');
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>
              {commentsLoading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  Cargando notas...
                </div>
              ) : noteComments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  Aún no tienes notas en esta orden.
                </div>
              ) : (
                noteComments.map((comment) => {
                  const author = comment.user
                    ? [comment.user.firstName, comment.user.lastName].filter(Boolean).join(' ')
                    : '—';
                  return (
                    <div key={comment.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
                      {editingCommentId === comment.id ? (
                        <textarea
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          rows={3}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-700">{cleanItemTag(comment.content)}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="rounded-full bg-sand px-3 py-1">
                          {comment.isInternal ? 'Interna' : 'Pública'}
                        </span>
                        <span>{formatDate(comment.createdAt)}</span>
                        <span>{author}</span>
                        <div className="ml-auto flex items-center gap-2">
                          {editingCommentId === comment.id ? (
                            <>
                              <button
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingValue('');
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                className="rounded-full bg-brand px-3 py-1 text-xs text-white"
                                onClick={async () => {
                                  if (!order?.id || !token || !editingValue.trim()) return;
                                  const updated = await apiRequest<WorkOrderComment>(
                                    `/work-orders/${order.id}/comments/${comment.id}`,
                                    {
                                      method: 'PATCH',
                                      headers: { Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ content: editingValue.trim() }),
                                    },
                                  );
                                  setComments((prev) =>
                                    prev.map((c) => (c.id === comment.id ? updated : c)),
                                  );
                                  setEditingCommentId(null);
                                  setEditingValue('');
                                }}
                              >
                                Guardar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingValue(cleanItemTag(comment.content));
                                }}
                              >
                                Editar
                              </button>
                              <button
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-red-600"
                                onClick={async () => {
                                  if (!order?.id || !token) return;
                                  await apiRequest(`/work-orders/${order.id}/comments/${comment.id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                  setComments((prev) => prev.filter((c) => c.id !== comment.id));
                                }}
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          {activeTab === 'diagnosticos' ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <textarea
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                  rows={3}
                  placeholder="Escribe un diagnóstico..."
                  value={newDiagnostic}
                  onChange={(e) => setNewDiagnostic(e.target.value)}
                />
                <div className="flex w-full items-center justify-end gap-2">
                  <button
                    className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                    onClick={async () => {
                      if (!newDiagnostic.trim() || !order?.id || !token) return;
                      const created = await apiRequest<WorkOrderComment>(
                        `/work-orders/${order.id}/comments`,
                        {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                          body: JSON.stringify({
                            content: newDiagnostic.trim(),
                            isInternal: true,
                            kind: 'diagnostic',
                          }),
                        },
                      );
                      setComments((prev) => [created, ...prev]);
                      setNewDiagnostic('');
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {commentsLoading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  Cargando diagnósticos...
                </div>
              ) : diagnosticComments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  Diagnósticos pendientes de registrar.
                </div>
              ) : (
                diagnosticComments.map((comment) => {
                  const author = comment.user
                    ? [comment.user.firstName, comment.user.lastName].filter(Boolean).join(' ')
                    : '—';
                  return (
                    <div key={comment.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
                      <p className="text-gray-700">{comment.content}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="rounded-full bg-sand px-3 py-1">Interno</span>
                        <span>{formatDate(comment.createdAt)}</span>
                        <span>{author}</span>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-red-600"
                            onClick={async () => {
                              if (!order?.id || !token) return;
                              await apiRequest(`/work-orders/${order.id}/comments/${comment.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              setComments((prev) => prev.filter((c) => c.id !== comment.id));
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          {activeTab === 'archivos' ? (
            <div className="mt-4">
              {attachmentsLoading ? (
                <p className="text-sm text-gray-500">Cargando archivos...</p>
              ) : attachments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  Sin archivos aún.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {attachments.map((file) => {
                    const isImage = (file.mimeType || '').startsWith('image/');
                    return (
                      <div key={file.id} className="rounded-lg border border-gray-200 p-2">
                        {isImage ? (
                          <a href={file.fileUrl} target="_blank">
                            <img
                              src={file.fileUrl}
                              alt={file.fileName}
                              className="h-32 w-full rounded-md object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            className="block rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-sand"
                          >
                            {file.fileName}
                          </a>
                        )}
                        <p className="mt-2 truncate text-[11px] text-gray-500">{file.fileName}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="file"
                  className="text-xs"
                  onChange={async (e) => {
                    if (!token || !order?.id) return;
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const form = new FormData();
                    form.append('file', file);
                    const res = await fetch(
                      `${apiBase}/files/upload?entityType=work_order&entityId=${order.id}`,
                      {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: form,
                      },
                    );
                    if (res.ok) {
                      const created = await res.json();
                      setAttachments((prev) => [created, ...prev]);
                    }
                    setUploading(false);
                    e.currentTarget.value = '';
                  }}
                />
                {uploading ? <span>Subiendo...</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {uiNotice ? (
        <div
          className={`fixed bottom-5 right-5 z-[100] rounded-xl px-4 py-2 text-sm text-white shadow-xl ${
            uiNotice.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {uiNotice.message}
        </div>
      ) : null}
      </div>
    </main>
  );
}
