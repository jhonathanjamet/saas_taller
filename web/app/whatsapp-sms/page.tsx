'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { apiRequest } from '../../lib/api';

type MessagingConfig = {
  whatsappMode: 'api' | 'qr';
  whatsappEnabled: boolean;
  whatsappApiUrl: string;
  whatsappApiKey: string;
  whatsappInstance: string;
  smsEnabled: boolean;
  smsApiUrl: string;
  smsApiKey: string;
  smsSender: string;
  emailEnabled: boolean;
  emailApiUrl: string;
  emailApiKey: string;
  emailFrom: string;
};

const DEFAULT_CONFIG: MessagingConfig = {
  whatsappMode: 'api',
  whatsappEnabled: false,
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappInstance: '',
  smsEnabled: false,
  smsApiUrl: '',
  smsApiKey: '',
  smsSender: '',
  emailEnabled: false,
  emailApiUrl: '',
  emailApiKey: '',
  emailFrom: '',
};

export default function WhatsappSmsPage() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const [form, setForm] = useState<MessagingConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testingChannel, setTestingChannel] = useState<'whatsapp' | 'sms' | 'email' | null>(null);
  const [qrStatus, setQrStatus] = useState<{
    status: string;
    qr?: string | null;
    lastError?: string | null;
    connectedAt?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    apiRequest<MessagingConfig>('/integrations/messaging', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((cfg) => setForm({ ...DEFAULT_CONFIG, ...cfg }))
      .catch(() => {});
    apiRequest<any>('/integrations/messaging/whatsapp-qr/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setQrStatus)
      .catch(() => {});
  }, [token]);

  const setField = <K extends keyof MessagingConfig>(key: K, value: MessagingConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const testChannel = async (channel: 'whatsapp' | 'sms' | 'email') => {
    if (!token) return;
    const phone = testPhone.replace(/[^\d+]/g, '');
    const email = testEmail.trim();
    if ((channel === 'whatsapp' || channel === 'sms') && !phone) {
      window.alert('Ingresa un teléfono de prueba');
      return;
    }
    if (channel === 'email' && !email) {
      window.alert('Ingresa un correo de prueba');
      return;
    }

    setTestingChannel(channel);
    try {
      const result = await apiRequest<{ ok: boolean; results: Array<{ channel: string; status: string; detail?: string }> }>(
        '/integrations/messaging/send-order-link',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            orderUrl: 'https://demo.tallerhub.local/orden/preview',
            message: 'Mensaje de prueba desde TallerHub',
            toPhone: phone || undefined,
            toEmail: email || undefined,
            channels: [channel],
          }),
        },
      );
      const item = result.results[0];
      if (item?.status === 'sent') {
        setMessage(`Prueba ${channel.toUpperCase()} enviada correctamente.`);
      } else {
        setMessage(
          `Prueba ${channel.toUpperCase()} no enviada automáticamente (${item?.detail || item?.status || 'sin detalle'}).`,
        );
      }
    } catch (error: any) {
      setMessage(error?.message || `No se pudo probar ${channel.toUpperCase()}.`);
    } finally {
      setTestingChannel(null);
    }
  };

  const refreshQrStatus = async () => {
    if (!token) return;
    try {
      const state = await apiRequest<any>('/integrations/messaging/whatsapp-qr/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQrStatus(state);
    } catch {}
  };

  const startQrSession = async () => {
    if (!token) return;
    setMessage('');
    try {
      await apiRequest('/integrations/messaging/whatsapp-qr/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshQrStatus();
      setMessage('Sesión QR iniciada. Escanea el código con tu WhatsApp.');
    } catch (error: any) {
      setMessage(error?.message || 'No se pudo iniciar sesión QR.');
    }
  };

  const stopQrSession = async () => {
    if (!token) return;
    setMessage('');
    try {
      await apiRequest('/integrations/messaging/whatsapp-qr/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshQrStatus();
      setMessage('Sesión QR desconectada.');
    } catch (error: any) {
      setMessage(error?.message || 'No se pudo desconectar sesión QR.');
    }
  };

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4">
              <h1 className="text-xl font-semibold text-ink">WhatsApp / SMS / Correo</h1>
            </div>
          </header>

          <div className="mx-auto max-w-6xl space-y-5 px-6 py-8">
            {message ? (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
            ) : null}

            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-ink">API WhatsApp</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-600">Modo de conexión</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={form.whatsappMode}
                    onChange={(e) => setField('whatsappMode', e.target.value as 'api' | 'qr')}
                  >
                    <option value="api">API (Meta/proveedor)</option>
                    <option value="qr">Beta QR (WhatsApp Web)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">API URL</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="https://tu-proveedor.com/send-whatsapp"
                    value={form.whatsappApiUrl}
                    onChange={(e) => setField('whatsappApiUrl', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">API Key</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="token"
                    value={form.whatsappApiKey}
                    onChange={(e) => setField('whatsappApiKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Instancia</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="instancia-01"
                    value={form.whatsappInstance}
                    onChange={(e) => setField('whatsappInstance', e.target.value)}
                  />
                </div>
                <label className="mt-7 inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.whatsappEnabled}
                    onChange={(e) => setField('whatsappEnabled', e.target.checked)}
                  />
                  Habilitar WhatsApp
                </label>
              </div>
              {form.whatsappMode === 'qr' ? (
                <div className="mt-5 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">WhatsApp Beta QR</p>
                      <p className="text-xs text-gray-600">
                        Estado: <span className="font-semibold">{qrStatus?.status || 'idle'}</span>
                      </p>
                      {qrStatus?.lastError ? (
                        <p className="mt-1 text-xs text-red-600">{qrStatus.lastError}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700"
                        onClick={refreshQrStatus}
                      >
                        Actualizar
                      </button>
                      <button
                        className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                        onClick={startQrSession}
                      >
                        Generar QR
                      </button>
                      <button
                        className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700"
                        onClick={stopQrSession}
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>

                  {qrStatus?.qr ? (
                    <div className="mt-4 inline-block rounded-xl border border-gray-200 bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                          qrStatus.qr,
                        )}`}
                        alt="QR WhatsApp"
                        className="h-[220px] w-[220px]"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[260px] flex-1">
                  <label className="text-sm text-gray-600">Teléfono de prueba</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="+56912345678"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </div>
                <button
                  className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700"
                  onClick={() => testChannel('whatsapp')}
                  disabled={testingChannel !== null}
                >
                  {testingChannel === 'whatsapp' ? 'Probando...' : 'Probar WhatsApp'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-ink">API SMS</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-600">API URL</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="https://tu-proveedor.com/send-sms"
                    value={form.smsApiUrl}
                    onChange={(e) => setField('smsApiUrl', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">API Key</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={form.smsApiKey}
                    onChange={(e) => setField('smsApiKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Remitente</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="TALLER"
                    value={form.smsSender}
                    onChange={(e) => setField('smsSender', e.target.value)}
                  />
                </div>
                <label className="mt-7 inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.smsEnabled}
                    onChange={(e) => setField('smsEnabled', e.target.checked)}
                  />
                  Habilitar SMS
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[260px] flex-1">
                  <label className="text-sm text-gray-600">Teléfono de prueba</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="+56912345678"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </div>
                <button
                  className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700"
                  onClick={() => testChannel('sms')}
                  disabled={testingChannel !== null}
                >
                  {testingChannel === 'sms' ? 'Probando...' : 'Probar SMS'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-ink">API Correo</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-600">API URL</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="https://tu-proveedor.com/send-email"
                    value={form.emailApiUrl}
                    onChange={(e) => setField('emailApiUrl', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">API Key</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={form.emailApiKey}
                    onChange={(e) => setField('emailApiKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Correo remitente</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="noreply@taller.com"
                    value={form.emailFrom}
                    onChange={(e) => setField('emailFrom', e.target.value)}
                  />
                </div>
                <label className="mt-7 inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.emailEnabled}
                    onChange={(e) => setField('emailEnabled', e.target.checked)}
                  />
                  Habilitar correo
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[260px] flex-1">
                  <label className="text-sm text-gray-600">Correo de prueba</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="cliente@correo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <button
                  className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700"
                  onClick={() => testChannel('email')}
                  disabled={testingChannel !== null}
                >
                  {testingChannel === 'email' ? 'Probando...' : 'Probar Correo'}
                </button>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
                disabled={saving}
                onClick={async () => {
                  if (!token) return;
                  setSaving(true);
                  setMessage('');
                  try {
                    await apiRequest('/integrations/messaging', {
                      method: 'PUT',
                      headers: { Authorization: `Bearer ${token}` },
                      body: JSON.stringify(form),
                    });
                    setMessage('Configuración de APIs guardada.');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
