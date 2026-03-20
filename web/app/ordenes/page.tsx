'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';

type Customer = {
  id: string;
  firstName: string;
  lastName?: string | null;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Asset = {
  id: string;
  customerId: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};

type Branch = { id: string; name: string };
type WorkOrderStatus = { id: string; name: string; code?: string | null };
type UserOption = { id: string; firstName?: string | null; lastName?: string | null; email?: string | null };
type ResponsibleOption = { id: string; name: string };
type WorkshopConfig = {
  proximaOrden?: string;
  correoCliente?: 'visible' | 'ocultar';
  telefonoCliente?: 'visible' | 'ocultar';
  eliminacionOrdenes?: 'todos' | 'solo_admin' | 'nadie';
};

type WorkOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  assetId?: string | null;
  statusId: string;
  status?: { id: string; name: string; code?: string | null } | null;
  orderType?: string | null;
  priority?: string | null;
  internalNotes?: string | null;
  initialDiagnosis?: string | null;
  technicalDiagnosis?: string | null;
  clientNotes?: string | null;
  totalAmount?: number | null;
  deliveredAt?: string | null;
  assignee?: { id: string; firstName?: string | null; lastName?: string | null } | null;
};

export default function OrdenesPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statuses, setStatuses] = useState<WorkOrderStatus[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<WorkOrder[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderBranchId, setOrderBranchId] = useState('');
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderAssetId, setOrderAssetId] = useState('');
  const [orderStatusId, setOrderStatusId] = useState('');
  const [orderPriority, setOrderPriority] = useState('medium');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'entrada' | 'reparacion' | 'salida'>('entrada');
  const [orderArea, setOrderArea] = useState<'entrada' | 'domicilio' | 'reparacion' | 'salida'>('entrada');
  const [orderStatusName, setOrderStatusName] = useState('Chequeo');
  const [orderResponsibleId, setOrderResponsibleId] = useState('');
  const [responsibles, setResponsibles] = useState<ResponsibleOption[]>([]);
  const [activeSubStatusId, setActiveSubStatusId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);
  const [showContactCreate, setShowContactCreate] = useState(false);
  const [contactType, setContactType] = useState<'person' | 'company'>('person');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactTaxId, setContactTaxId] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSaving, setContactSaving] = useState(false);
  const [showAssetCreate, setShowAssetCreate] = useState(false);
  const [assetCreateCustomerId, setAssetCreateCustomerId] = useState('');
  const [assetCreateBrand, setAssetCreateBrand] = useState('');
  const [assetCreateModel, setAssetCreateModel] = useState('');
  const [assetCreateType, setAssetCreateType] = useState('Genérico');
  const [assetCreateSerial, setAssetCreateSerial] = useState('');
  const [assetCreateIdentifier, setAssetCreateIdentifier] = useState('');
  const [assetCreateNotes, setAssetCreateNotes] = useState('');
  const [assetCreateError, setAssetCreateError] = useState('');
  const [showAssetBrandSuggestions, setShowAssetBrandSuggestions] = useState(false);
  const [showAssetModelSuggestions, setShowAssetModelSuggestions] = useState(false);
  const [showAssetTypeSuggestions, setShowAssetTypeSuggestions] = useState(false);
  const [assetCreateBrandManual, setAssetCreateBrandManual] = useState(false);
  const [assetCreateModelManual, setAssetCreateModelManual] = useState(false);
  const [assetCreateTypeManual, setAssetCreateTypeManual] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusSelection, setStatusSelection] = useState('');
  const [statusAreaSelection, setStatusAreaSelection] =
    useState<'entrada' | 'domicilio' | 'reparacion' | 'salida'>('entrada');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStatusId, setFilterStatusId] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [myOrdersOnly, setMyOrdersOnly] = useState(false);
  const [currentUserLabel, setCurrentUserLabel] = useState('');
  const [uiNotice, setUiNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const assetBrandInputRef = useRef<HTMLInputElement | null>(null);
  const assetModelInputRef = useRef<HTMLInputElement | null>(null);
  const assetTypeInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [confirmDeliverOrderId, setConfirmDeliverOrderId] = useState<string | null>(null);
  const [deliverConfirmChecked, setDeliverConfirmChecked] = useState(false);
  const [deliveringOrder, setDeliveringOrder] = useState(false);
  const [workshopConfig, setWorkshopConfig] = useState<WorkshopConfig>({});

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const RESPONSIBLES_ENABLED_KEY = 'order_responsibles_enabled_ids';
  const RESPONSIBLES_CATALOG_KEY = 'order_responsibles_catalog';

  const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const applyResponsibleFilter = (all: ResponsibleOption[]) => {
    if (typeof window === 'undefined') return all;
    const enabledIds = safeParse<string[]>(
      localStorage.getItem(RESPONSIBLES_ENABLED_KEY),
      [],
    );
    if (!enabledIds.length) return all;
    const filtered = all.filter((u) => enabledIds.includes(u.id));
    return filtered.length ? filtered : all;
  };

  const loadOrders = async () => {
    if (!token) return;
    const list = await apiRequest<WorkOrder[]>('/work-orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setWorkOrders(list);
  };

  const loadHistoryOrders = async () => {
    if (!token) return;
    const list = await apiRequest<WorkOrder[]>('/work-orders/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setHistoryOrders(list);
  };

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const localCatalog = safeParse<ResponsibleOption[]>(
      typeof window !== 'undefined'
        ? localStorage.getItem(RESPONSIBLES_CATALOG_KEY)
        : null,
      [],
    );
    if (localCatalog.length) {
      const visible = applyResponsibleFilter(localCatalog);
      setResponsibles(visible);
      if (!orderResponsibleId && visible.length) {
        const me = visible.find((u) => normalizeText(u.name).includes('jhonathan jamet'));
        setOrderResponsibleId((me || visible[0]).id);
      }
    }

    apiRequest<Customer[]>('/customers', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setCustomers);
    apiRequest<Asset[]>('/assets', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setAssets);
    apiRequest<Branch[]>('/branches', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((list) => {
      setBranches(list);
      if (!orderBranchId && list.length > 0) setOrderBranchId(list[0].id);
    });
    apiRequest<WorkOrderStatus[]>('/work-order-statuses', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((list) => {
      setStatuses(list);
      if (!orderStatusId && list.length > 0) setOrderStatusId(list[0].id);
    });
    apiRequest<UserOption[]>('/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((list) => {
        const mapped = list
          .map((u) => ({
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || 'Usuario',
          }))
          .filter((u) => Boolean(u.id));
        if (mapped.length) {
          const visible = applyResponsibleFilter(mapped);
          setResponsibles(visible);
          if (typeof window !== 'undefined') {
            localStorage.setItem(RESPONSIBLES_CATALOG_KEY, JSON.stringify(mapped));
          }
          if (!orderResponsibleId) {
            const me = visible.find((u) => normalizeText(u.name).includes('jhonathan jamet'));
            setOrderResponsibleId((me || visible[0]).id);
          }
        }
      })
      .catch(() => {
        // Si no hay permiso para /users, dejamos fallback local.
      });
    apiRequest<WorkshopConfig>('/tenants/workshop-config', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((cfg) => {
        setWorkshopConfig(cfg || {});
        if (!orderNumber && cfg?.proximaOrden) {
          setOrderNumber(String(cfg.proximaOrden));
        }
      })
      .catch(() => {});
    loadOrders();
  }, [token]);

  useEffect(() => {
    if (!showHistory) return;
    loadHistoryOrders();
  }, [showHistory]);

  useEffect(() => {
    if (!showDetail || !selectedOrderId || !token) return;
    setAttachmentsLoading(true);
    apiRequest<any[]>(
      `/files?entityType=work_order&entityId=${encodeURIComponent(selectedOrderId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then(setAttachments)
      .finally(() => setAttachmentsLoading(false));
  }, [showDetail, selectedOrderId, token]);

  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const email = String(payload?.email || '').toLowerCase();
      const sub = String(payload?.sub || '');
      const fromEmail = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
      setCurrentUserLabel(fromEmail || 'usuario');
      if (sub) {
        setResponsibles((prev) => {
          const fallbackName = 'Jhonathan Jamet';
          const merged = prev.some((u) => u.id === sub) ? prev : [{ id: sub, name: fallbackName }, ...prev];
          return applyResponsibleFilter(merged);
        });
        if (!orderResponsibleId) setOrderResponsibleId(sub);
      }
    } catch {
      setCurrentUserLabel('usuario');
      if (!responsibles.length) {
        setResponsibles(applyResponsibleFilter([{ id: 'local-jhonathan', name: 'Jhonathan Jamet' }]));
        if (!orderResponsibleId) setOrderResponsibleId('local-jhonathan');
      }
    }
  }, [token, orderResponsibleId, responsibles.length]);

  useEffect(() => {
    const syncResponsibles = () => {
      const catalog = safeParse<ResponsibleOption[]>(
        typeof window !== 'undefined' ? localStorage.getItem(RESPONSIBLES_CATALOG_KEY) : null,
        [],
      );
      if (!catalog.length) return;
      const visible = applyResponsibleFilter(catalog);
      setResponsibles(visible);
      if (!visible.some((r) => r.id === orderResponsibleId) && visible.length) {
        setOrderResponsibleId(visible[0].id);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('order-responsibles-updated', syncResponsibles as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('order-responsibles-updated', syncResponsibles as EventListener);
      }
    };
  }, [orderResponsibleId]);

  useEffect(() => {
    if (!uiNotice) return;
    const t = setTimeout(() => setUiNotice(null), 2600);
    return () => clearTimeout(t);
  }, [uiNotice]);

  useEffect(() => {
    if (!showCreate) return;
    const selectedCustomer = customers.find((c) => c.id === orderCustomerId);
    if (selectedCustomer) {
      setCustomerSearch(customerLabel(selectedCustomer));
    }
    const selectedAsset = assets.find((a) => a.id === orderAssetId);
    if (selectedAsset) {
      setAssetSearch(assetLabel(selectedAsset));
    }
  }, [showCreate, customers, assets, orderCustomerId, orderAssetId]);

  async function createWorkOrder(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    if (!orderCustomerId) {
      setError('Selecciona un cliente.');
      return;
    }
    try {
      const resolvedStatusId =
        statuses.find((s) => s.name.toLowerCase() === orderStatusName.toLowerCase())?.id ||
        orderStatusId;
      const created = await apiRequest<WorkOrder>('/work-orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...(orderNumber ? { orderNumber } : {}),
          branchId: orderBranchId,
          customerId: orderCustomerId,
          assetId: orderAssetId || undefined,
          statusId: resolvedStatusId,
          priority: orderPriority,
          orderType: orderArea,
          assignedTo:
            orderResponsibleId && !orderResponsibleId.startsWith('local-')
              ? orderResponsibleId
              : undefined,
          internalNotes: `Responsable: ${
            responsibles.find((r) => r.id === orderResponsibleId)?.name || 'Jhonathan Jamet'
          }`,
        }),
      });
      setWorkOrders((prev) => [created, ...prev]);
      const createdNumber = Number(String(created.orderNumber || '').match(/\d+/g)?.join('') || 0);
      if (Number.isFinite(createdNumber) && createdNumber > 0) {
        setOrderNumber(String(createdNumber + 1));
      } else {
        setOrderNumber('');
      }
      setOrderCustomerId('');
      setOrderAssetId('');
      setCustomerSearch('');
      setAssetSearch('');
      setOrderStatusName('Chequeo');
      setOrderArea('entrada');
      setShowCreate(false);
    } catch (err: any) {
      setError(err.message || 'Error creando orden');
    }
  }

  const resetContactForm = () => {
    setContactType('person');
    setContactFirstName('');
    setContactLastName('');
    setContactTaxId('');
    setContactAddress('');
    setContactNote('');
    setContactEmail('');
    setContactPhone('');
    setContactError('');
  };

  const resetAssetCreateForm = () => {
    setAssetCreateBrand('');
    setAssetCreateModel('');
    setAssetCreateType('Genérico');
    setAssetCreateSerial('');
    setAssetCreateIdentifier('');
    setAssetCreateNotes('');
    setAssetCreateError('');
    setShowAssetBrandSuggestions(false);
    setShowAssetModelSuggestions(false);
    setShowAssetTypeSuggestions(false);
    setAssetCreateBrandManual(false);
    setAssetCreateModelManual(false);
    setAssetCreateTypeManual(false);
  };

  const createContact = async () => {
    if (!token || contactSaving) return;
    setContactError('');
    const firstName = contactFirstName.trim();
    const lastName = contactLastName.trim();
    const taxId = contactTaxId.trim();
    const email = contactEmail.trim();
    const phone = contactPhone.trim();
    const emailVisible = workshopConfig.correoCliente !== 'ocultar';
    const phoneVisible = workshopConfig.telefonoCliente !== 'ocultar';
    const isEmailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPhoneValid = phone.length === 0 || /^[+\d\s()-]{8,20}$/.test(phone);

    if (!firstName) {
      setContactError('El nombre es obligatorio.');
      return;
    }
    if (!lastName && contactType === 'person') {
      setContactError('El apellido es obligatorio.');
      return;
    }
    if (!taxId) {
      setContactError('El CI es obligatorio.');
      return;
    }
    if (emailVisible && !isEmailValid) {
      setContactError('El correo electrónico es inválido.');
      return;
    }
    if (phoneVisible && !isPhoneValid) {
      setContactError('El teléfono predeterminado es inválido.');
      return;
    }

    try {
      setContactSaving(true);
      const created = await apiRequest<Customer>('/customers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: contactType,
          firstName,
          ...(lastName ? { lastName } : {}),
          ...(taxId ? { taxId } : {}),
          ...(emailVisible && email ? { email } : {}),
          ...(phoneVisible && phone ? { phone } : {}),
        }),
      });
      setCustomers((prev) => [created, ...prev]);
      setOrderCustomerId(created.id);
      setCustomerSearch(customerLabel(created));
      setAssetCreateCustomerId(created.id);
      setShowContactCreate(false);
      resetContactForm();
      setUiNotice({ type: 'success', message: 'Contacto creado correctamente.' });
    } catch (err: any) {
      setContactError(err?.message || 'No se pudo crear el contacto.');
    } finally {
      setContactSaving(false);
    }
  };

  const normalizedStatus = (name?: string | null) => {
    const value = (name || '').toLowerCase();
    if (['ingresada', 'entrada'].some((k) => value.includes(k))) return 'entrada';
    if (['reparacion', 'reparación'].some((k) => value.includes(k))) return 'reparacion';
    if (['salida', 'lista', 'reparado', 'no reparado', 'cambio', 'instalado', 'retenido', 'sin solución', 'sin solucion', 'no presentó', 'no presento'].some((k) => value.includes(k))) return 'salida';
    if (value.includes('entreg')) return 'salida';
    return 'entrada';
  };

  const normalizedArea = (value?: string | null) => {
    const text = (value || '').toLowerCase();
    if (['entrada', 'ingreso'].some((k) => text.includes(k))) return 'entrada';
    if (['reparacion', 'reparación'].some((k) => text.includes(k))) return 'reparacion';
    if (['salida', 'entrega', 'entregado'].some((k) => text.includes(k))) return 'salida';
    if (['domicilio', 'terreno'].some((k) => text.includes(k))) return 'entrada';
    return 'entrada';
  };

  const normalizeText = (value?: string | null) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();

  const getOrderArea = (order: WorkOrder) => {
    if (order.orderType) return normalizedArea(order.orderType);
    const status = order.status || statuses.find((s) => s.id === order.statusId);
    if (status) return normalizedStatus(status.name);
    return 'entrada';
  };

  const AREA_OPTIONS = [
    { id: 'entrada', label: 'Entrada' },
    { id: 'domicilio', label: 'Domicilio' },
    { id: 'reparacion', label: 'Reparación' },
    { id: 'salida', label: 'Salida' },
  ] as const;

  const STATUS_OPTIONS_BY_AREA: Record<string, string[]> = {
    entrada: ['Chequeo', 'Sin estado'],
    reparacion: ['Chequeo', 'Esperando repuesto', 'Esperando respuesta', 'Reparación'],
    salida: ['Cambio', 'Instalado', 'No presentó falla', 'No reparado', 'Reparado', 'Retenido', 'Sin solución'],
    domicilio: ['Chequeo', 'Sin estado'],
  };

  const extractResponsable = (order: WorkOrder) => {
    const assigneeName = [order.assignee?.firstName, order.assignee?.lastName].filter(Boolean).join(' ').trim();
    if (assigneeName) return assigneeName;
    const notes = order.internalNotes;
    if (!notes) return '—';
    const match = notes.match(/responsable\s*:\s*(.+)/i);
    if (match?.[1]) return match[1].trim();
    return notes.trim() || '—';
  };

  const formatOrderNumber = (value?: string | null) => {
    if (!value) return '';
    const digits = value.match(/\d+/g)?.join('') || '';
    if (!digits) return value;
    const parsed = Number(digits);
    if (!Number.isFinite(parsed)) return digits;
    return String(parsed);
  };

  const subStatusConfig = {
    entrada: [
      { id: 'chequeo', label: 'Chequeo', codes: ['chequeo'], aliases: ['chequeo'] },
      { id: 'sin_estado', label: 'Sin estado', codes: ['sin_estado'], aliases: ['sin estado'] },
    ],
    reparacion: [
      { id: 'chequeo', label: 'Chequeo', codes: ['chequeo'], aliases: ['chequeo'] },
      { id: 'esperando_repuesto', label: 'Esperando repuesto', codes: ['esperando_repuesto'], aliases: ['esperando repuesto'] },
      { id: 'esperando_respuesta', label: 'Esperando respuesta', codes: ['esperando_respuesta'], aliases: ['esperando respuesta'] },
      { id: 'reparacion', label: 'Reparación', codes: ['reparacion', 'en_reparacion'], aliases: ['reparacion', 'en reparacion'] },
    ],
    salida: [
      { id: 'cambio', label: 'Cambio', codes: ['cambio'], aliases: ['cambio'] },
      { id: 'instalado', label: 'Instalado', codes: ['instalado'], aliases: ['instalado'] },
      { id: 'no_presento_falla', label: 'No presentó falla', codes: ['no_presento_falla'], aliases: ['no presento falla', 'no presenta falla'] },
      { id: 'no_reparado', label: 'No reparado', codes: ['no_reparado'], aliases: ['no reparado'] },
      { id: 'reparado', label: 'Reparado', codes: ['reparado', 'entregada', 'lista_entrega', 'lista_para_entrega'], aliases: ['reparado', 'entregada', 'lista para entrega', 'lista entrega'] },
      { id: 'retenido', label: 'Retenido', codes: ['retenido'], aliases: ['retenido'] },
      { id: 'sin_solucion', label: 'Sin solución', codes: ['sin_solucion'], aliases: ['sin solucion'] },
    ],
  } as const;

  const inferStatusFromOrderText = (
    order: WorkOrder,
    area: 'entrada' | 'reparacion' | 'salida',
  ) => {
    const haystack = normalizeText(
      [order.technicalDiagnosis, order.initialDiagnosis, order.clientNotes].filter(Boolean).join(' '),
    );

    if (area === 'salida') {
      if (haystack.includes('no reparad')) return 'no_reparado';
      if (haystack.includes('sin solucion')) return 'sin_solucion';
      if (haystack.includes('retenid')) return 'retenido';
      if (haystack.includes('instalad')) return 'instalado';
      if (haystack.includes('no present')) return 'no_presento_falla';
      if (haystack.includes('cambi')) return 'cambio';
      if (haystack.includes('reparad')) return 'reparado';
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
  };

  const getEffectiveStatusCode = (
    order: WorkOrder,
    forcedArea?: 'entrada' | 'reparacion' | 'salida',
  ) => {
    const area = forcedArea || getOrderArea(order);
    const config = subStatusConfig[area] || [];
    const status = order.status || statuses.find((s) => s.id === order.statusId);
    const statusCode = normalizeText(status?.code);
    const statusName = normalizeText(status?.name);

    if (statusCode) {
      const byCode = config.find((g) => g.codes.some((code) => normalizeText(code) === statusCode));
      if (byCode) return byCode.id;
    }

    if (statusName) {
      const byName = config.find(
        (g) =>
          normalizeText(g.label) === statusName ||
          g.aliases.some((alias) => statusName.includes(normalizeText(alias))),
      );
      if (byName) return byName.id;
    }

    return inferStatusFromOrderText(order, area);
  };

  const getStatusLabelByCode = (
    area: 'entrada' | 'reparacion' | 'salida',
    code: string,
  ) => subStatusConfig[area].find((s) => s.id === code)?.label || 'Chequeo';

  const customerLabel = (c: Customer) =>
    [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.legalName || 'Sin nombre';
  const assetLabel = (a: Asset) => [a.brand, a.model, a.serialNumber].filter(Boolean).join(' ') || 'Sin serie';

  const normalizedCustomerSearch = normalizeText(customerSearch);
  const filteredCustomerOptions = customers
    .filter((c) => {
      if (!normalizedCustomerSearch) return true;
      const haystack = normalizeText(
        `${customerLabel(c)} ${c.legalName || ''} ${c.email || ''} ${c.phone || ''} ${c.taxId || ''}`,
      );
      return haystack.includes(normalizedCustomerSearch);
    })
    .slice(0, 8);

  const normalizedAssetSearch = normalizeText(assetSearch);
  const filteredAssetOptions = assets
    .filter((a) => {
      if (orderCustomerId && a.customerId !== orderCustomerId) return false;
      if (!normalizedAssetSearch) return true;
      return normalizeText(assetLabel(a)).includes(normalizedAssetSearch);
    })
    .slice(0, 8);

  const brandOptions = Array.from(
    new Set(
      assets
        .map((a) => (a.brand || '').trim())
        .filter((v) => v.length > 0),
    ),
  );

  const modelOptions = Array.from(
    new Set(
      assets
        .filter((a) => {
          if (!assetCreateBrand.trim()) return true;
          return normalizeText(a.brand).includes(normalizeText(assetCreateBrand));
        })
        .map((a) => (a.model || '').trim())
        .filter((v) => v.length > 0),
    ),
  );

  const typeOptions = [
    'Genérico',
    'Amplificador',
    'Notebook',
    'Consola',
    'Celular',
    'Tablet',
    'PC',
    'Impresora',
    'Audio',
    'Otro',
  ];

  const filteredBrandOptions = brandOptions
    .filter((b) => {
      if (!assetCreateBrand.trim()) return true;
      return normalizeText(b).includes(normalizeText(assetCreateBrand));
    })
    .slice(0, 8);

  const filteredModelOptions = modelOptions
    .filter((m) => {
      if (!assetCreateModel.trim()) return true;
      return normalizeText(m).includes(normalizeText(assetCreateModel));
    })
    .slice(0, 8);

  const filteredTypeOptions = typeOptions
    .filter((t) => {
      if (!assetCreateType.trim()) return true;
      return normalizeText(t).includes(normalizeText(assetCreateType));
    })
    .slice(0, 8);

  const ordersSource = showHistory ? historyOrders : workOrders;

  const filteredOrders = ordersSource
    .filter((o) => {
      if (!search) return true;
      const customer = customers.find((c) => c.id === o.customerId);
      const customerName = customer
        ? [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim().toLowerCase() ||
          (customer.legalName || '').toLowerCase()
        : '';
      return (
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        customerName.includes(search.toLowerCase())
      );
    })
    .filter((o) => getOrderArea(o) === activeTab)
    .filter((o) => {
      if (!activeSubStatusId) return true;
      return getEffectiveStatusCode(o, activeTab) === activeSubStatusId;
    })
    .filter((o) => {
      if (filterStatusId && o.statusId !== filterStatusId) return false;
      if (filterPriority && o.priority !== filterPriority) return false;
      if (myOrdersOnly) {
        const responsable = normalizeText(extractResponsable(o));
        const current = normalizeText(currentUserLabel);
        if (!current) return true;
        return responsable.includes(current);
      }
      return true;
    });

  const canDeleteOrders = workshopConfig.eliminacionOrdenes !== 'nadie';

  const exportOrdersCsv = () => {
    const rows = filteredOrders.map((o) => {
      const customer = customers.find((c) => c.id === o.customerId);
      const asset = assets.find((a) => a.id === o.assetId);
      const status = o.status || statuses.find((s) => s.id === o.statusId);
      const customerName =
        customer ? [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() : '';
      return {
        numero: formatOrderNumber(o.orderNumber),
        prioridad: o.priority || '',
        area: getOrderArea(o),
        estado: status?.name || '',
        marca: asset?.brand || '',
        modelo: asset?.model || asset?.serialNumber || '',
        cliente: customerName || customer?.legalName || '',
        responsable: extractResponsable(o),
        total: Number(o.totalAmount || 0),
      };
    });

    const header = ['numero', 'prioridad', 'area', 'estado', 'marca', 'modelo', 'cliente', 'responsable', 'total'];
    const csv = [
      header.join(','),
      ...rows.map((r) =>
        header
          .map((k) => `"${String((r as Record<string, unknown>)[k] ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordenes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setUiNotice({ type: 'success', message: 'CSV exportado.' });
  };

  const statusCounts = ordersSource.reduce(
    (acc, o) => {
      const key = getOrderArea(o);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { entrada: 0, reparacion: 0, salida: 0 } as Record<'entrada' | 'reparacion' | 'salida', number>,
  );

  const subStatusList = (() => {
    const ordersInArea = ordersSource.filter((o) => getOrderArea(o) === activeTab);
    const config = subStatusConfig[activeTab] || [];

    const groups = config.map((cfg) => ({
      id: cfg.id,
      label: cfg.label,
      count: 0,
    }));

    for (const order of ordersInArea) {
      const statusCode = getEffectiveStatusCode(order, activeTab);
      const group = groups.find((g) => g.id === statusCode);
      if (group) {
        group.count += 1;
      }
    }

    return groups.map((g) => ({
      id: g.id,
      name: g.label,
      count: g.count,
    }));
  })();

  const selectedOrder = selectedOrderId
    ? [...workOrders, ...historyOrders].find((o) => o.id === selectedOrderId) || null
    : null;
  const deliverOrder = confirmDeliverOrderId
    ? [...workOrders, ...historyOrders].find((o) => o.id === confirmDeliverOrderId) || null
    : null;
  const selectedOrderArea = showStatusModal
    ? statusAreaSelection
    : selectedOrder
    ? getOrderArea(selectedOrder)
    : 'entrada';
  const allowedStatusNames = STATUS_OPTIONS_BY_AREA[selectedOrderArea] || [];
  const allowedCodes = (subStatusConfig[selectedOrderArea] || [])
    .flatMap((c) => c.codes)
    .map((c) => normalizeText(c));
  const allowedStatuses = statuses.filter((s) => {
    const code = normalizeText(s.code);
    const name = normalizeText(s.name);
    return allowedCodes.length
      ? (code && allowedCodes.includes(code)) || allowedStatusNames.some((n) => normalizeText(n) === name)
      : allowedStatusNames.some((n) => normalizeText(n) === name);
  });

  useEffect(() => {
    if (!showStatusModal) return;
    if (!allowedStatuses.length) return;
    const exists = allowedStatuses.some((s) => s.id === statusSelection);
    if (!exists) {
      setStatusSelection(allowedStatuses[0].id);
    }
  }, [showStatusModal, allowedStatuses, statusSelection]);

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-[#efeff0]">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-600">
                  <span>🔎</span>
                  <input className="w-28 bg-transparent text-sm outline-none" placeholder="Buscar [E" />
                </div>
                <div className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">📅 16/03/2026</div>
                <div className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700">💬 0</div>
                <div className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700">🟢 0</div>
              </div>

              <div className="flex items-center gap-2 text-base text-gray-600">
                <button
                  className="h-9 w-9 rounded-xl bg-white border border-gray-300"
                  onClick={() => {
                    setError('');
                    setShowCreate(true);
                  }}
                >
                  ✎
                </button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => setShowContactCreate(true)}>⊕</button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => router.push('/whatsapp-sms')}>🎧</button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => setFiltersOpen((v) => !v)}>☰</button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => router.push('/whatsapp-sms')}>💬</button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => setUiNotice({ type: 'success', message: 'Sin notificaciones pendientes.' })}>🔔</button>
                <button
                  className="h-9 w-9 rounded-full bg-white border border-gray-400"
                  onClick={() => {
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                  }}
                >
                  👤
                </button>
              </div>
            </div>
          </header>
          <div className="px-5 py-5 space-y-5">
            <section className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl leading-none font-medium text-[#3b3f48]">Taller</h1>
                <p className="mt-1 text-sm text-gray-500">Principal › Taller › <span className="text-brand">Órdenes</span></p>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => router.push('/integraciones')}>🛠️</button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={exportOrdersCsv}>📄</button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => window.print()}>🖨️</button>
                <button
                  className={`h-9 rounded-xl border px-3 text-sm ${myOrdersOnly ? 'bg-brand text-white border-brand' : 'bg-white border-gray-300'}`}
                  onClick={() => {
                    const next = !myOrdersOnly;
                    setMyOrdersOnly(next);
                    setUiNotice({
                      type: 'success',
                      message: next ? 'Filtro: mis órdenes.' : 'Filtro de mis órdenes desactivado.',
                    });
                  }}
                >
                  📋 Mis órdenes
                </button>
                <button
                  className={`h-9 rounded-xl border px-3 text-sm ${
                    showHistory ? 'bg-[#1f78c8] text-white border-[#1f78c8]' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  onClick={() => {
                    const next = !showHistory;
                    setShowHistory(next);
                    setActiveSubStatusId(null);
                    setUiNotice({
                      type: 'success',
                      message: next ? 'Mostrando historial de entregadas.' : 'Mostrando órdenes activas.',
                    });
                  }}
                >
                  🕘 Historial
                </button>
                <button
                  className="h-9 rounded-xl bg-brand text-white px-4 text-sm"
                  onClick={() => {
                    setError('');
                    setShowCreate(true);
                  }}
                >
                  ＋ Crear
                </button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => searchInputRef.current?.focus()}>🔍</button>
                <button className="h-9 w-9 rounded-xl bg-white border border-gray-300" onClick={() => setShowHelpModal(true)}>❔</button>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 shadow flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-red-600">Alerta de órdenes</p>
                  <p className="mt-1 text-sm text-gray-600">Una vencida <span className="text-brand">Listado</span></p>
                </div>
                <div className="h-9 w-9 rounded-full bg-red-50 text-sm text-red-500 flex items-center justify-center font-semibold">
                  ⚠
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-[#3b3f48]">
                    {showHistory ? 'Órdenes entregadas' : 'Órdenes abiertas'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {ordersSource.length} {showHistory ? 'Entregadas' : 'Abiertas'} <span className="text-brand">Listado</span>
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-brand/10 text-sm text-brand flex items-center justify-center font-semibold">
                  📊
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-[#3b3f48]">Notificaciones SMS</p>
                  <p className="mt-1 text-sm text-gray-600">0 Créditos <span className="text-brand">Recargar</span></p>
                </div>
                <div className="h-9 w-9 rounded-full bg-orange-50 text-sm text-orange-500 flex items-center justify-center font-semibold">
                  💬
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              <div className="rounded-2xl bg-white p-4 shadow flex flex-wrap items-center gap-3">
                {[
                  { id: 'entrada', label: 'Entrada' },
                  { id: 'reparacion', label: 'Reparación' },
                  { id: 'salida', label: 'Salida' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`rounded-full px-4 py-2 text-sm ${
                      activeTab === tab.id
                        ? 'bg-brand text-white'
                        : 'bg-sand text-gray-600 hover:text-ink'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setActiveSubStatusId(null);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {tab.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-700'
                        }`}
                      >
                        {statusCounts[tab.id as 'entrada' | 'reparacion' | 'salida']}
                      </span>
                    </span>
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <input
                    ref={searchInputRef}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm"
                    placeholder="Buscar orden o cliente"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button className="h-9 w-9 rounded-full bg-sand text-gray-500">⏷</button>
                  <button
                    className="h-9 w-9 rounded-full bg-sand text-gray-500"
                    onClick={() => {
                      if (showHistory) {
                        loadHistoryOrders();
                      } else {
                        loadOrders();
                      }
                    }}
                  >
                    ⟳
                  </button>
                  <button
                    className="rounded-full bg-brand px-4 py-2 text-white text-sm"
                    onClick={() => {
                      setError('');
                      setShowCreate(true);
                    }}
                  >
                    Crear
                  </button>
                </div>
              </div>

            </section>

            <div className="grid gap-6">
            <section className="rounded-2xl bg-white p-4 shadow">
              <div className="flex flex-wrap items-center gap-2">
                {subStatusList.length === 0 ? (
                  <span className="text-sm text-gray-500">Sin subdivisiones.</span>
                ) : (
                  subStatusList.map((sub) => (
                    <button
                      key={sub.id}
                      disabled={sub.count === 0}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        activeSubStatusId === sub.id
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-gray-200 bg-white text-gray-600'
                      } ${sub.count === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                      onClick={() =>
                        setActiveSubStatusId(activeSubStatusId === sub.id ? null : sub.id)
                      }
                    >
                      <span>{sub.name}</span>
                      <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-gray-700">
                        {sub.count}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-sm text-gray-600">
                <span>Cantidad: {filteredOrders.length} Órdenes</span>
                <span>⏱ Tiempo tareas: 0/Min. (Restantes)</span>
              </div>
            </section>
            <section className="rounded-2xl bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <h2 className="text-[32px] leading-none font-medium text-ink">Órdenes</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                    <span className="text-gray-400">🔍</span>
                    <input
                      className="w-44 bg-transparent text-sm outline-none placeholder:text-gray-400"
                      placeholder="Buscar [ENTER]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <button
                    className="h-9 w-9 rounded-xl bg-sand text-gray-500"
                    title="Filtros"
                    onClick={() => setFiltersOpen((prev) => !prev)}
                  >
                    ⏷
                  </button>
                  <button
                    className="h-9 w-9 rounded-xl bg-sand text-gray-500"
                    title="Actualizar"
                    onClick={() => loadOrders()}
                  >
                    ⟳
                  </button>
                </div>
              </div>
              {filtersOpen ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Estado</span>
                    <select
                      className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                      value={filterStatusId}
                      onChange={(e) => setFilterStatusId(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Prioridad</span>
                    <select
                      className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                    >
                      <option value="">Todas</option>
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <button
                    className="rounded-full bg-sand px-3 py-1 text-xs text-gray-600"
                    onClick={() => {
                      setFilterPriority('');
                      setFilterStatusId('');
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              ) : null}
              <div className="mt-3 overflow-auto">
                <table className="min-w-full border-separate border-spacing-y-1.5 text-sm">
                  <thead>
                    <tr className="text-left text-[13px] uppercase tracking-wide text-gray-500">
                      <th className="py-1.5 w-10"></th>
                      <th className="py-1.5">N°</th>
                      <th className="py-1.5">Prioridad</th>
                      <th className="py-1.5">Estado</th>
                      <th className="py-1.5">Marca</th>
                      <th className="py-1.5">Modelo</th>
                      <th className="py-1.5">Cliente</th>
                      <th className="py-1.5">Responsable</th>
                      <th className="py-1.5">Precio</th>
                      <th className="py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const customer = customers.find((c) => c.id === o.customerId);
                      const asset = assets.find((a) => a.id === o.assetId);
                      const status = o.status || statuses.find((s) => s.id === o.statusId);
                      const area = getOrderArea(o);
                      const effectiveStatusCode = getEffectiveStatusCode(o, area);
                      const displayStatusLabel = getStatusLabelByCode(area, effectiveStatusCode);
                      const priorityLabel = o.priority === 'urgent'
                        ? 'Urgente'
                        : o.priority === 'high'
                        ? 'Alta'
                        : o.priority === 'low'
                        ? 'Baja'
                        : 'Media';
                      const priorityColor =
                        o.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : o.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : o.priority === 'low'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-sand text-gray-600';
                      const responsable = extractResponsable(o);
                      const totalValue = Number(o.totalAmount ?? 0);
                      const precio = Number.isFinite(totalValue) ? `$${totalValue.toFixed(0)}` : '$0';
                      const marca = asset?.brand || 'Genérica';
                      const modelo = asset?.model || asset?.serialNumber || '-';
                      const fullName = customer
                        ? [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim()
                        : '';
                      const displayCustomer = fullName || customer?.legalName || o.customerId;
                      return (
                        <tr key={o.id}>
                          <td className="py-1.5 bg-sand/60 rounded-l-xl">
                            <div className="h-7 w-7 rounded-full bg-white/80 text-xs text-gray-600 flex items-center justify-center">
                              🔧
                            </div>
                          </td>
                          <td className="py-1.5 bg-sand/60 font-medium text-ink">
                            {formatOrderNumber(o.orderNumber)}
                          </td>
                          <td className="py-1.5 bg-sand/60">
                            <span className={`rounded-full px-2 py-0.5 text-[12px] ${priorityColor}`}>
                              {priorityLabel}
                            </span>
                          </td>
                          <td className="py-1.5 bg-sand/60">
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[12px] text-blue-700">
                              {displayStatusLabel || status?.name || '-'}
                            </span>
                          </td>
                          <td className="py-1.5 bg-sand/60">{marca}</td>
                          <td className="py-1.5 bg-sand/60">{modelo}</td>
                          <td className="py-1.5 bg-sand/60">
                            {displayCustomer}
                          </td>
                          <td className="py-1.5 bg-sand/60">{responsable}</td>
                          <td className="py-1.5 bg-sand/60">{precio}</td>
                          <td className="py-1.5 bg-sand/60 rounded-r-xl">
                            <div className="flex items-center gap-2">
                              <button
                                className="h-7 w-7 rounded-xl bg-sand text-xs text-gray-600"
                                title="Ver"
                                onClick={() => {
                                  router.push(`/ordenes/${o.id}`);
                                }}
                              >
                                👁
                              </button>
                              <button
                                className="h-7 w-7 rounded-xl bg-sand text-xs text-gray-600"
                                title="Imprimir"
                                onClick={() => {
                                  router.push(`/ordenes/${o.id}?print=1`);
                                }}
                              >
                                🖨
                              </button>
                              <button
                                className={`h-7 w-7 rounded-xl text-xs ${
                                  area === 'salida'
                                    ? 'bg-[#1f78c8] text-white'
                                    : 'bg-sand text-gray-400'
                                }`}
                                title={
                                  area === 'salida'
                                    ? 'Marcar como entregada'
                                    : 'Disponible solo en área Salida'
                                }
                                disabled={area !== 'salida'}
                                onClick={() => {
                                  if (area !== 'salida') return;
                                  setConfirmDeliverOrderId(o.id);
                                  setDeliverConfirmChecked(false);
                                  setMenuOpenId(null);
                                }}
                              >
                                🤝
                              </button>
                              <div className="relative">
                                <button
                                  className="h-7 w-7 rounded-xl bg-sand text-xs text-gray-600"
                                  title="Más"
                                  onClick={() => setMenuOpenId(menuOpenId === o.id ? null : o.id)}
                                >
                                  ⋮
                                </button>
                                {menuOpenId === o.id ? (
                                  <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-gray-200 bg-white p-2 text-sm shadow">
                                    <button
                                      className="w-full rounded-md px-3 py-2 text-left hover:bg-sand"
                                      onClick={() => {
                                        setSelectedOrderId(o.id);
                                        setStatusSelection(o.statusId);
                                        setStatusAreaSelection(
                                          getOrderArea(o) as 'entrada' | 'reparacion' | 'salida',
                                        );
                                        setShowStatusModal(true);
                                        setMenuOpenId(null);
                                      }}
                                    >
                                      Cambiar estado
                                    </button>
                                    {canDeleteOrders ? (
                                      <button
                                        className="w-full rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          setConfirmDeleteOrderId(o.id);
                                          setMenuOpenId(null);
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={10}>
                          No hay órdenes aún.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
            </div>
          </div>
        </div>
      </div>
      {showHelpModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-ink">Ayuda rápida</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• `📄` exporta el listado filtrado a CSV.</li>
              <li>• `🖨️` imprime la vista actual.</li>
              <li>• `📋 Mis órdenes` activa filtro por responsable.</li>
              <li>• `☰` abre/cierra filtros de tabla.</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <button className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700" onClick={() => setShowHelpModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {confirmDeliverOrderId ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-center text-3xl leading-tight font-medium text-ink">
              ¿Confirma que está por entregar esta orden?
            </h3>
            <p className="mt-4 text-center text-xl text-red-500">
              <span className="font-semibold">¡Atención!</span> Recuerde que esta acción es irreversible.
            </p>
            <div className="mt-7 flex items-center justify-end gap-4">
              <label className="mr-auto flex items-center gap-2 text-lg text-gray-700">
                <input
                  type="checkbox"
                  className="h-6 w-6 rounded border-gray-300"
                  checked={deliverConfirmChecked}
                  onChange={(e) => setDeliverConfirmChecked(e.target.checked)}
                />
                Confirmo la entrega de esta orden
              </label>
              <button
                className="rounded-2xl bg-sand px-7 py-3 text-lg text-gray-700"
                onClick={() => {
                  setConfirmDeliverOrderId(null);
                  setDeliverConfirmChecked(false);
                }}
                disabled={deliveringOrder}
              >
                Cancelar
              </button>
              <button
                className="rounded-2xl bg-[#82c984] px-7 py-3 text-lg text-white disabled:opacity-50"
                disabled={!deliverConfirmChecked || deliveringOrder}
                onClick={async () => {
                  if (!token || !confirmDeliverOrderId) return;
                  setDeliveringOrder(true);
                  try {
                    await apiRequest(`/work-orders/${confirmDeliverOrderId}/deliver`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const deliveredOrder = [...workOrders, ...historyOrders].find(
                      (item) => item.id === confirmDeliverOrderId,
                    );
                    setWorkOrders((prev) => prev.filter((item) => item.id !== confirmDeliverOrderId));
                    if (deliveredOrder) {
                      setHistoryOrders((prev) => [
                        { ...deliveredOrder, deliveredAt: new Date().toISOString(), orderType: 'salida' },
                        ...prev.filter((item) => item.id !== deliveredOrder.id),
                      ]);
                    }
                    setUiNotice({
                      type: 'success',
                      message: `Orden ${deliverOrder?.orderNumber || ''} entregada correctamente.`,
                    });
                    setConfirmDeliverOrderId(null);
                    setDeliverConfirmChecked(false);
                  } catch (err: any) {
                    setUiNotice({
                      type: 'error',
                      message: err?.message || 'No se pudo registrar la entrega.',
                    });
                  } finally {
                    setDeliveringOrder(false);
                  }
                }}
              >
                {deliveringOrder ? 'Guardando...' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {confirmDeleteOrderId ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-ink">Eliminar orden</h3>
            <p className="mt-2 text-sm text-gray-600">
              ¿Seguro que deseas eliminar esta orden? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700"
                onClick={() => setConfirmDeleteOrderId(null)}
                disabled={deletingOrder}
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-red-600 px-4 py-2 text-sm text-white disabled:bg-red-300"
                disabled={deletingOrder}
                onClick={async () => {
                  if (!token || !confirmDeleteOrderId) return;
                  setDeletingOrder(true);
                  try {
                    await apiRequest(`/work-orders/${confirmDeleteOrderId}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setWorkOrders((prev) =>
                      prev.filter((item) => item.id !== confirmDeleteOrderId),
                    );
                    setUiNotice({ type: 'success', message: 'Orden eliminada.' });
                    setConfirmDeleteOrderId(null);
                  } catch (err: any) {
                    setUiNotice({ type: 'error', message: err?.message || 'No se pudo eliminar la orden.' });
                  } finally {
                    setDeletingOrder(false);
                  }
                }}
              >
                {deletingOrder ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {uiNotice ? (
        <div
          className={`fixed bottom-5 right-5 z-[60] rounded-xl px-4 py-2 text-sm text-white shadow-xl ${
            uiNotice.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {uiNotice.message}
        </div>
      ) : null}
      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-3 py-4">
          <div className="w-full max-w-6xl rounded-3xl bg-[#f8f8f8] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-ink">Creando Orden</h2>
              <button
                className="text-2xl leading-none text-gray-500 hover:text-ink"
                onClick={() => setShowCreate(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-300 bg-white">
              <div className="flex items-end border-b border-gray-300 px-4 pt-3 text-sm">
                <button className="rounded-t-xl border border-b-0 border-gray-300 bg-white px-5 py-2">General</button>
                <button className="ml-2 rounded-t-xl px-5 py-2 text-gray-500">Diagnóstico</button>
              </div>

              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Cliente *</label>
                    <div className="relative">
                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-white">
                      <span className="px-3 text-sm text-gray-500">⌕</span>
                      <input
                        className="h-10 w-full border-0 px-1 text-sm outline-none"
                        placeholder="Buscar por nombre o DNI"
                        value={customerSearch}
                        onFocus={() => setShowCustomerSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 120)}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setOrderCustomerId('');
                          setOrderAssetId('');
                          setAssetSearch('');
                          setShowCustomerSuggestions(true);
                        }}
                      />
                      <span className="border-l border-gray-300 px-3 text-gray-500">⌄</span>
                      <button
                        className="h-10 w-10 bg-[#1f78c8] text-xl text-white"
                        onClick={() => {
                          setContactFirstName(customerSearch.trim());
                          setShowContactCreate(true);
                        }}
                      >
                        +
                      </button>
                    </div>
                    {showCustomerSuggestions && customerSearch.trim() ? (
                      <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                        {filteredCustomerOptions.length ? (
                          filteredCustomerOptions.map((c) => (
                            <button
                              key={c.id}
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sand"
                              onClick={() => {
                                setOrderCustomerId(c.id);
                                setCustomerSearch(customerLabel(c));
                                setShowCustomerSuggestions(false);
                              }}
                            >
                              {customerLabel(c)}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No existe. Crea uno con el botón `+`.
                          </div>
                        )}
                      </div>
                    ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Equipo *</label>
                    <div className="relative">
                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-white">
                      <span className="px-3 text-sm text-gray-500">⌕</span>
                      <input
                        className="h-10 w-full border-0 px-1 text-sm outline-none"
                        placeholder="Buscar por n° serie"
                        value={assetSearch}
                        onFocus={() => setShowAssetSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowAssetSuggestions(false), 120)}
                        onChange={(e) => {
                          setAssetSearch(e.target.value);
                          setOrderAssetId('');
                          setShowAssetSuggestions(true);
                        }}
                      />
                      <span className="border-l border-gray-300 px-3 text-gray-500">⌄</span>
                      <button
                        className="h-10 w-10 bg-[#1f78c8] text-xl text-white"
                        onClick={() => {
                          resetAssetCreateForm();
                          setAssetCreateCustomerId(orderCustomerId || '');
                          setShowAssetCreate(true);
                        }}
                      >
                        +
                      </button>
                    </div>
                    {showAssetSuggestions && assetSearch.trim() ? (
                      <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                        {filteredAssetOptions.length ? (
                          filteredAssetOptions.map((a) => (
                            <button
                              key={a.id}
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sand"
                              onClick={() => {
                                setOrderAssetId(a.id);
                                setAssetSearch(assetLabel(a));
                                setShowAssetSuggestions(false);
                              }}
                            >
                              {assetLabel(a)}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No existe. Crea uno con el botón `+`.
                          </div>
                        )}
                      </div>
                    ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Prioridad</label>
                    <select
                      className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm"
                      value={orderPriority}
                      onChange={(e) => {
                        const v = e.target.value;
                        setOrderPriority(v === 'high' || v === 'urgent' || v === 'low' ? v : 'medium');
                      }}
                    >
                      <option value="medium">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Área</label>
                    <select
                      className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm"
                      value={orderArea}
                      onChange={(e) => {
                        const value = e.target.value as 'entrada' | 'domicilio' | 'reparacion' | 'salida';
                        setOrderArea(value);
                        const nextStatus = STATUS_OPTIONS_BY_AREA[value]?.[0] || 'Chequeo';
                        setOrderStatusName(nextStatus);
                      }}
                    >
                      <option value="">Seleccionar Área</option>
                      {AREA_OPTIONS.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Estado</label>
                    <select
                      className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm"
                      value={orderStatusName}
                      onChange={(e) => setOrderStatusName(e.target.value)}
                    >
                      {(STATUS_OPTIONS_BY_AREA[orderArea] || []).map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Responsable</label>
                    <select
                      className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm"
                      value={orderResponsibleId}
                      onChange={(e) => setOrderResponsibleId(e.target.value)}
                    >
                      {responsibles.length ? (
                        responsibles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))
                      ) : (
                        <option value="">Jhonathan Jamet</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Trabajo *</label>
                    <textarea className="h-24 w-full rounded-xl border border-gray-300 p-3 text-sm" placeholder="Trabajo a realizar" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Descripción (Estado general)</label>
                    <textarea className="h-24 w-full rounded-xl border border-gray-300 p-3 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Diagnóstico</label>
                    <select className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm">
                      <option>No</option>
                      <option>Si</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Garantía</label>
                    <select className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm">
                      <option>No</option>
                      <option>Si</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Fecha prometida</label>
                    <input className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm" type="date" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Presupuesto</label>
                    <input className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm" placeholder="$ 0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Adelanto</label>
                    <input className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm" placeholder="$ Importe" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Plantilla de tareas</label>
                    <select className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm">
                      <option>Asignar grupo de tareas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">Accesorios entregados</label>
                  <div className="rounded-xl border border-gray-300 px-4 py-4 text-sm text-gray-500">
                    No existen accesorios configurados.
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-500">
                  Soltá los archivos aquí o hacé clic para buscarlos en tu computadora.
                  <button className="ml-3 rounded-lg border border-gray-400 px-4 py-1 text-sm text-gray-700">
                    Examinar
                  </button>
                </div>

                {error ? (
                  <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button className="rounded-xl bg-gray-100 px-6 py-2 text-sm text-gray-600" onClick={() => setShowCreate(false)}>
                    Cancelar
                  </button>
                  <button
                    className="rounded-xl bg-[#1976d2] px-6 py-2 text-sm text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      createWorkOrder(e as any);
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showContactCreate ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">Creando Contacto</h2>
              <button
                className="h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:text-ink"
                onClick={() => {
                  setShowContactCreate(false);
                  resetContactForm();
                }}
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center text-gray-400">
                <div className="h-32 w-32 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center">
                  Foto
                </div>
                <button className="mt-4 rounded-full bg-sand px-4 py-2 text-xs text-gray-600">
                  Editar
                </button>
              </div>

              <div className="lg:col-span-2 grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-gray-600">Tipo de cliente</label>
                    <select
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value as 'person' | 'company')}
                    >
                      <option value="person">Persona</option>
                      <option value="company">Empresa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nombre *</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={contactFirstName}
                      onChange={(e) => setContactFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Apellido *</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={contactLastName}
                      onChange={(e) => setContactLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-gray-600">CI *</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={contactTaxId}
                      onChange={(e) => setContactTaxId(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Dirección</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Nota/observación</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    rows={3}
                    value={contactNote}
                    onChange={(e) => setContactNote(e.target.value)}
                  />
                </div>

                {contactError ? (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {contactError}
                  </div>
                ) : null}
              </div>
            </div>

            {workshopConfig.correoCliente !== 'ocultar' || workshopConfig.telefonoCliente !== 'ocultar' ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {workshopConfig.correoCliente !== 'ocultar' ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600">Correos electrónicos</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Correo electrónico"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                      <button className="rounded-md border border-gray-200 px-3 py-2 text-xs">🗑</button>
                    </div>
                    <button className="mt-3 rounded-full bg-sand px-4 py-2 text-xs text-gray-600">
                      + Agregar
                    </button>
                  </div>
                ) : (
                  <div />
                )}
                {workshopConfig.telefonoCliente !== 'ocultar' ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600">Teléfonos</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Teléfono"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                      <button className="rounded-md border border-gray-200 px-3 py-2 text-xs">🗑</button>
                    </div>
                    <button className="mt-3 rounded-full bg-sand px-4 py-2 text-xs text-gray-600">
                      + Agregar
                    </button>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-full px-5 py-2 text-sm text-gray-600 hover:text-ink"
                onClick={() => {
                  setShowContactCreate(false);
                  resetContactForm();
                }}
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-brand px-5 py-2 text-sm text-white disabled:opacity-60"
                onClick={createContact}
                disabled={contactSaving}
              >
                {contactSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAssetCreate ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">Creando Equipo</h2>
              <button
                className="h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:text-ink"
                onClick={() => {
                  setShowAssetCreate(false);
                  resetAssetCreateForm();
                }}
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center text-gray-400">
                <div className="h-32 w-32 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center">
                  Foto
                </div>
                <button className="mt-4 rounded-full bg-sand px-4 py-2 text-xs text-gray-600">
                  Editar
                </button>
              </div>

              <div className="lg:col-span-2 grid gap-4">
                {!assetCreateCustomerId ? (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    Selecciona un cliente en la orden antes de crear el equipo.
                  </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-gray-600">Marca *</label>
                    <div className="relative mt-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={assetBrandInputRef}
                          className={`w-full rounded-md px-3 py-2 text-sm ${
                            assetCreateError && !assetCreateBrand.trim()
                              ? 'border border-red-300'
                              : 'border border-gray-200'
                          }`}
                          placeholder="Seleccionar Marca"
                          value={assetCreateBrand}
                          onFocus={() => {
                            if (!assetCreateBrandManual) setShowAssetBrandSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowAssetBrandSuggestions(false), 120)}
                          onChange={(e) => {
                            setAssetCreateBrand(e.target.value);
                            if (!assetCreateBrandManual) setShowAssetBrandSuggestions(true);
                          }}
                        />
                        {assetCreateBrandManual ? (
                          <>
                            <button
                              className="h-10 w-10 rounded-md bg-[#1f78c8] text-white"
                              onClick={() => {
                                setAssetCreateBrand((v) => v.trim());
                                setAssetCreateBrandManual(false);
                                setShowAssetBrandSuggestions(false);
                              }}
                              title="Guardar marca"
                              type="button"
                            >
                              💾
                            </button>
                            <button
                              className="h-10 w-10 rounded-md bg-gray-200 text-gray-700"
                              onClick={() => {
                                setAssetCreateBrandManual(false);
                                setAssetCreateBrand('');
                                setShowAssetBrandSuggestions(false);
                              }}
                              title="Cancelar marca"
                              type="button"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="h-10 w-10 rounded-md bg-brand text-white"
                              onClick={() => {
                                setAssetCreateBrandManual(true);
                                setAssetCreateBrand('');
                                setShowAssetBrandSuggestions(false);
                                setTimeout(() => assetBrandInputRef.current?.focus(), 0);
                              }}
                              title="Nueva marca"
                              type="button"
                            >
                              +
                            </button>
                            <button
                              className="h-10 w-10 rounded-md bg-brand text-white"
                              onClick={() => {
                                setAssetCreateBrandManual(false);
                                setAssetCreateBrand('');
                                setShowAssetBrandSuggestions(false);
                              }}
                              title="Limpiar marca"
                              type="button"
                            >
                              ⟳
                            </button>
                          </>
                        )}
                      </div>
                      {showAssetBrandSuggestions && !assetCreateBrandManual ? (
                        <div className="absolute z-40 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                          {filteredBrandOptions.length ? (
                            filteredBrandOptions.map((brand) => (
                              <button
                                key={brand}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-sand"
                                onClick={() => {
                                  setAssetCreateBrand(brand);
                                  setShowAssetBrandSuggestions(false);
                                }}
                                type="button"
                              >
                                {brand}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">Escribe una marca nueva.</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Modelo *</label>
                    <div className="relative mt-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={assetModelInputRef}
                          className={`w-full rounded-md px-3 py-2 text-sm ${
                            assetCreateError && !assetCreateModel.trim()
                              ? 'border border-red-300'
                              : 'border border-gray-200'
                          }`}
                          placeholder="Seleccionar Modelo"
                          value={assetCreateModel}
                          onFocus={() => {
                            if (!assetCreateModelManual) setShowAssetModelSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowAssetModelSuggestions(false), 120)}
                          onChange={(e) => {
                            setAssetCreateModel(e.target.value);
                            if (!assetCreateModelManual) setShowAssetModelSuggestions(true);
                          }}
                        />
                        {assetCreateModelManual ? (
                          <>
                            <button
                              className="h-10 w-10 rounded-md bg-[#1f78c8] text-white"
                              onClick={() => {
                                setAssetCreateModel((v) => v.trim());
                                setAssetCreateModelManual(false);
                                setShowAssetModelSuggestions(false);
                              }}
                              title="Guardar modelo"
                              type="button"
                            >
                              💾
                            </button>
                            <button
                              className="h-10 w-10 rounded-md bg-gray-200 text-gray-700"
                              onClick={() => {
                                setAssetCreateModelManual(false);
                                setAssetCreateModel('');
                                setShowAssetModelSuggestions(false);
                              }}
                              title="Cancelar modelo"
                              type="button"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="h-10 w-10 rounded-md bg-brand text-white"
                              onClick={() => {
                                setAssetCreateModelManual(true);
                                setAssetCreateModel('');
                                setShowAssetModelSuggestions(false);
                                setTimeout(() => assetModelInputRef.current?.focus(), 0);
                              }}
                              title="Nuevo modelo"
                              type="button"
                            >
                              +
                            </button>
                            <button
                              className="h-10 w-10 rounded-md bg-brand text-white"
                              onClick={() => {
                                setAssetCreateModelManual(false);
                                setAssetCreateModel('');
                                setShowAssetModelSuggestions(false);
                              }}
                              title="Limpiar modelo"
                              type="button"
                            >
                              ⟳
                            </button>
                          </>
                        )}
                      </div>
                      {showAssetModelSuggestions && !assetCreateModelManual ? (
                        <div className="absolute z-40 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                          {filteredModelOptions.length ? (
                            filteredModelOptions.map((model) => (
                              <button
                                key={model}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-sand"
                                onClick={() => {
                                  setAssetCreateModel(model);
                                  setShowAssetModelSuggestions(false);
                                }}
                                type="button"
                              >
                                {model}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">Escribe un modelo nuevo.</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-gray-600">Tipo *</label>
                    <div className="relative mt-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={assetTypeInputRef}
                          className={`w-full rounded-md px-3 py-2 text-sm ${
                            assetCreateError && !assetCreateType.trim()
                              ? 'border border-red-300'
                              : 'border border-gray-200'
                          }`}
                          value={assetCreateType}
                          onFocus={() => {
                            if (!assetCreateTypeManual) setShowAssetTypeSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowAssetTypeSuggestions(false), 120)}
                          onChange={(e) => {
                            setAssetCreateType(e.target.value);
                            if (!assetCreateTypeManual) setShowAssetTypeSuggestions(true);
                          }}
                        />
                        {assetCreateTypeManual ? (
                          <>
                            <button
                              className="h-10 w-10 rounded-md bg-[#1f78c8] text-white"
                              onClick={() => {
                                setAssetCreateType((v) => v.trim() || 'Genérico');
                                setAssetCreateTypeManual(false);
                                setShowAssetTypeSuggestions(false);
                              }}
                              title="Guardar tipo"
                              type="button"
                            >
                              💾
                            </button>
                            <button
                              className="h-10 w-10 rounded-md bg-gray-200 text-gray-700"
                              onClick={() => {
                                setAssetCreateTypeManual(false);
                                setAssetCreateType('Genérico');
                                setShowAssetTypeSuggestions(false);
                              }}
                              title="Cancelar tipo"
                              type="button"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="h-10 w-10 rounded-md bg-brand text-white"
                              onClick={() => {
                                setAssetCreateTypeManual(true);
                                setAssetCreateType('');
                                setShowAssetTypeSuggestions(false);
                                setTimeout(() => assetTypeInputRef.current?.focus(), 0);
                              }}
                              title="Nuevo tipo"
                              type="button"
                            >
                              +
                            </button>
                            <button
                              className="h-10 w-10 rounded-md bg-brand text-white"
                              onClick={() => {
                                setAssetCreateTypeManual(false);
                                setAssetCreateType('Genérico');
                                setShowAssetTypeSuggestions(false);
                              }}
                              title="Restablecer tipo"
                              type="button"
                            >
                              ⟳
                            </button>
                          </>
                        )}
                      </div>
                      {showAssetTypeSuggestions && !assetCreateTypeManual ? (
                        <div className="absolute z-40 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                          {filteredTypeOptions.length ? (
                            filteredTypeOptions.map((type) => (
                              <button
                                key={type}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-sand"
                                onClick={() => {
                                  setAssetCreateType(type);
                                  setShowAssetTypeSuggestions(false);
                                }}
                                type="button"
                              >
                                {type}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">Escribe un tipo nuevo.</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-sm text-gray-600">N° Serie</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Opcional"
                        value={assetCreateSerial}
                        onChange={(e) => setAssetCreateSerial(e.target.value)}
                      />
                    </div>
                    <div className="pb-1">
                      <label className="text-xs text-gray-500 block">Activo</label>
                      <div className="mt-1 h-6 w-12 rounded-full bg-green-500/30 p-1">
                        <div className="h-4 w-4 rounded-full bg-green-600 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Identificador *</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={assetCreateIdentifier}
                    onChange={(e) => setAssetCreateIdentifier(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Observaciones</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    rows={4}
                    value={assetCreateNotes}
                    onChange={(e) => setAssetCreateNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {assetCreateError ? (
                <p className="mr-auto text-sm text-red-600">{assetCreateError}</p>
              ) : null}
              <button
                className="rounded-full px-5 py-2 text-sm text-gray-600 hover:text-ink"
                onClick={() => {
                  setShowAssetCreate(false);
                  resetAssetCreateForm();
                }}
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-brand px-5 py-2 text-sm text-white"
                onClick={async () => {
                  if (!token) return;
                  if (!assetCreateCustomerId) return;
                  const brandValue = assetCreateBrand.trim();
                  const modelValue = assetCreateModel.trim();
                  const typeValue = assetCreateType.trim();
                  if (!brandValue || !modelValue || !typeValue) {
                    setAssetCreateError('Completa Marca, Modelo y Tipo para continuar.');
                    return;
                  }
                  setAssetCreateError('');
                  const serialValue = assetCreateSerial || assetCreateIdentifier;
                  const created = await apiRequest<Asset>('/assets', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      customerId: assetCreateCustomerId,
                      brand: brandValue || undefined,
                      model: modelValue || undefined,
                      serialNumber: serialValue || undefined,
                    }),
                  });
                  setAssets((prev) => [created, ...prev]);
                  setOrderAssetId(created.id);
                  setAssetSearch(assetLabel(created));
                  setShowAssetCreate(false);
                  resetAssetCreateForm();
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDetail && selectedOrderId ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">Detalle de Orden</h2>
              <button
                className="h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:text-ink"
                onClick={() => setShowDetail(false)}
              >
                ✕
              </button>
            </div>
            {(() => {
              const order = workOrders.find((o) => o.id === selectedOrderId);
              if (!order) return <p className="mt-4 text-sm text-gray-500">Orden no encontrada.</p>;
              const customer = customers.find((c) => c.id === order.customerId);
              const asset = assets.find((a) => a.id === order.assetId);
              const status = statuses.find((s) => s.id === order.statusId);
              return (
                <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs uppercase text-gray-500">Número</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatOrderNumber(order.orderNumber)}
                    </p>
                    <p className="mt-3 text-xs uppercase text-gray-500">Cliente</p>
                    <p className="mt-1 text-ink">
                      {[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') ||
                        customer?.legalName ||
                        '—'}
                    </p>
                    <p className="mt-3 text-xs uppercase text-gray-500">Estado</p>
                    <p className="mt-1 text-ink">{status?.name || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs uppercase text-gray-500">Activo</p>
                    <p className="mt-1 text-ink">
                      {[asset?.brand, asset?.model, asset?.serialNumber].filter(Boolean).join(' ') || '—'}
                    </p>
                    <p className="mt-3 text-xs uppercase text-gray-500">Responsable</p>
                    <p className="mt-1 text-ink">{extractResponsable(order)}</p>
                    <p className="mt-3 text-xs uppercase text-gray-500">Total</p>
                    <p className="mt-1 text-ink">
                      {Number.isFinite(Number(order.totalAmount ?? 0))
                        ? `$${Number(order.totalAmount ?? 0).toFixed(0)}`
                        : '$0'}
                    </p>
                    <div className="mt-4 border-t border-gray-200 pt-3">
                      <p className="text-xs uppercase text-gray-500">Fotos / Adjuntos</p>
                      <div className="mt-2">
                        {attachmentsLoading ? (
                          <p className="text-xs text-gray-500">Cargando adjuntos...</p>
                        ) : attachments.length === 0 ? (
                          <p className="text-xs text-gray-500">Sin archivos aún.</p>
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
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="file"
                          className="text-xs"
                          onChange={async (e) => {
                            if (!token) return;
                            const file = e.target.files?.[0];
                            if (!file || !selectedOrderId) return;
                            setUploading(true);
                            const form = new FormData();
                            form.append('file', file);
                            const res = await fetch(
                              `${apiBase}/files/upload?entityType=work_order&entityId=${selectedOrderId}`,
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
                        {uploading ? <span className="text-xs text-gray-500">Subiendo...</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}

      {showStatusModal && selectedOrderId ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 px-4 py-8">
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
                className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                onClick={async () => {
                  if (!token) return;
                  await apiRequest(`/work-orders/${selectedOrderId}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      statusId: statusSelection,
                      orderType: statusAreaSelection,
                    }),
                  });
                  const selectedStatus = statuses.find((s) => s.id === statusSelection) || null;
                  setWorkOrders((prev) =>
                    prev.map((o) =>
                      o.id === selectedOrderId
                        ? {
                            ...o,
                            statusId: statusSelection,
                            orderType: statusAreaSelection,
                            status: selectedStatus
                              ? { id: selectedStatus.id, name: selectedStatus.name, code: selectedStatus.code }
                              : o.status,
                          }
                        : o,
                    ),
                  );
                  setShowStatusModal(false);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
