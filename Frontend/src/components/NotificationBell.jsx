import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
    FaBell,
    FaChevronDown,
    FaClock,
    FaExclamationTriangle,
    FaEye,
    FaTimes,
    FaCheck,
    FaInfoCircle
} from 'react-icons/fa';
import instance from '../api/axios';
import { useNotify } from '../context/notificationContext';

const STORAGE_KEY = 'presinf-alertas-vacunas-snoozed';
const SNOOZE_MS = 24 * 60 * 60 * 1000;

function loadSnoozed() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};

        const now = Date.now();
        const cleaned = {};
        Object.entries(parsed).forEach(([key, value]) => {
            const expiresAt = Number(value);
            if (Number.isFinite(expiresAt) && expiresAt > now) {
                cleaned[key] = expiresAt;
            }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        return cleaned;
    } catch {
        return {};
    }
}

function persistSnoozed(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function priorityStyles(prioridad) {
    switch (prioridad) {
        case 'critical':
            return {
                border: 'border-red-200 hover:border-red-300',
                bg: 'bg-red-50/70',
                accent: 'text-red-700',
                badge: 'bg-red-600 text-white',
                label: 'Crítica',
            };
        case 'high':
            return {
                border: 'border-orange-200 hover:border-orange-300',
                bg: 'bg-orange-50/70',
                accent: 'text-orange-700',
                badge: 'bg-orange-500 text-white',
                label: 'Alta',
            };
        default:
            return {
                border: 'border-amber-200 hover:border-amber-300',
                bg: 'bg-amber-50/70',
                accent: 'text-amber-700',
                badge: 'bg-amber-500 text-white',
                label: 'Media',
            };
    }
}

function formatDays(days) {
    if (days < 0) {
        return `Vencida hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
    }
    if (days === 0) {
        return 'Vence hoy';
    }
    return `Faltan ${days} día${days === 1 ? '' : 's'}`;
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
}

export default function NotificationBell({ onNavigate, global = false }) {
    const notify = useNotify();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [alertas, setAlertas] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [processingIds, setProcessingIds] = useState([]);
    const [snoozed, setSnoozed] = useState(() => loadSnoozed());
    const panelRef = useRef(null);

    const fetchAlertas = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await instance.get('/notificaciones/alertas-vacunas');
            setAlertas(Array.isArray(data) ? data : []);
        } catch (err) {
            const message = err.response?.data?.message || 'No se pudieron cargar las alertas de vacunas';
            setError(message);
            notify.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlertas();
        const interval = setInterval(fetchAlertas, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await instance.get('/notificaciones');
            // mostrar solo las leídas relacionadas con alertas de vacunas
            setHistoryList(Array.isArray(data) ? data.filter((n) => n.leida && n.tipo === 'alerta_vacuna') : []);
        } catch (err) {
            const message = err.response?.data?.message || 'No se pudo cargar el historial';
            setError(message);
            notify.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setExpandedId(null);
        fetchAlertas();
    }, [open]);

    useEffect(() => {
        const cleaned = loadSnoozed();
        const currentKeys = Object.keys(snoozed);
        const cleanedKeys = Object.keys(cleaned);

        if (currentKeys.length !== cleanedKeys.length || currentKeys.some((key) => !cleaned[key])) {
            setSnoozed(cleaned);
        }
    }, [snoozed]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [open]);

    const alertasVisibles = useMemo(() => {
        const now = Date.now();
        const activeSnoozed = Object.fromEntries(
            Object.entries(snoozed).filter(([, expiresAt]) => Number(expiresAt) > now),
        );

        return alertas
            .filter((alerta) => !activeSnoozed[String(alerta.id_notificacion)])
            .filter((alerta) => !alerta.leida) // ocultar las ya marcadas como leídas
            .sort((a, b) => a.dias_restantes - b.dias_restantes);
    }, [alertas, snoozed]);

    useEffect(() => {
        persistSnoozed(snoozed);
    }, [snoozed]);

    const unreadCount = alertasVisibles.filter((alerta) => !alerta.leida).length;

    const marcarComoLeida = async (alerta) => {
        if (!alerta?.id_notificacion || processingIds.includes(alerta.id_notificacion)) return;

        setProcessingIds((prev) => [...prev, alerta.id_notificacion]);
        try {
            await instance.patch(`/notificaciones/alertas-vacunas/${alerta.id_notificacion}/leida`);
            // remover la alerta del estado visible
            setAlertas((prev) => prev.filter((item) => item.id_notificacion !== alerta.id_notificacion));
            notify.success('Alerta marcada como vista');
        } catch (err) {
            const message = err.response?.data?.message || 'No se pudo marcar la alerta como vista';
            notify.error(message);
        } finally {
            setProcessingIds((prev) => prev.filter((id) => id !== alerta.id_notificacion));
        }
    };

    const posponer = (alerta) => {
        if (!alerta?.id_notificacion) return;

        const nextState = { ...snoozed, [String(alerta.id_notificacion)]: Date.now() + SNOOZE_MS };
        setSnoozed(nextState);
        persistSnoozed(nextState);
        setExpandedId((current) => (current === alerta.id_notificacion ? null : current));
        notify.info('Alerta pospuesta por 24 horas');
    };

    const totalCount = alertasVisibles.length;

    const wrapperClass = global
        ? 'fixed top-4 right-4 z-[70] inline-block'
        : 'relative inline-block';

    const bellContent = (
        <div className={wrapperClass} ref={panelRef}>
            {/* Botón de la campana */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${open
                        ? 'bg-slate-950 text-white border-slate-950 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                aria-label="Abrir notificaciones"
                aria-expanded={open}
            >
                <FaBell className={`text-base transition-transform duration-200 ${unreadCount > 0 && !open ? 'animate-[swing_1s_ease-in-out_infinite]' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown de Notificaciones */}
            {open && (
                <div className="absolute right-0 top-full z-[70] mt-3 w-[min(400px,95vw)] origin-top-right rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ease-out"> 

                        {/* Triángulo indicador: Solo visible en pantallas grandes */}
                        <div className="hidden sm:block absolute -top-1.5 right-[14px] h-3 w-3 rotate-45 border-l border-t bg-white" />

                    {/* Cabecera */}
                    <div className="relative flex items-start justify-between gap-3 overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-950 to-slate-800 px-4 py-4 text-white">
                        <div className="z-10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Panel de Control</span>
                            <h3 className="text-base font-semibold leading-tight text-white">{showHistory ? 'Historial de Notificaciones' : 'Próximos Vencimientos'}</h3>
                            <p className="mt-1 text-[11px] text-slate-300">{showHistory ? 'Notificaciones leídas' : 'Margen actual de ±5 días respecto al límite.'}</p>
                        </div>
                        <div className="flex items-center gap-2 z-10">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!showHistory) await fetchHistory();
                                    setShowHistory((s) => !s);
                                }}
                                className="rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
                            >
                                {showHistory ? 'Volver' : 'Historial'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                aria-label="Cerrar"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Listado con altura máxima responsiva */}
                    <div className="max-h-[calc(100vh-180px)] sm:max-h-[380px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {loading && (
                            <div className="space-y-2 p-2">
                                <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                                <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            </div>
                        )}

                        {!loading && error && (
                            <div className="m-1 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                                <FaInfoCircle className="mt-0.5 shrink-0 text-red-500" />
                                <span>{error}</span>
                            </div>
                        )}

                        {!loading && !error && !showHistory && totalCount === 0 && (
                            <div className="my-6 flex flex-col items-center justify-center px-4 py-6 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                                    <FaCheck className="text-lg" />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-800">Al día</p>
                                <p className="mt-1 text-xs text-slate-400 max-w-[220px]">
                                    No existen vacunas con vencimiento crítico o próximo.
                                </p>
                            </div>
                        )}

                        {!loading && !error && !showHistory && alertasVisibles.map((alerta) => {
                            const styles = priorityStyles(alerta.prioridad);
                            const expanded = expandedId === alerta.id_notificacion;
                            const diasLabel = formatDays(alerta.dias_restantes);
                            const badgeIcon = alerta.estado === 'vencida' ? <FaExclamationTriangle /> : <FaClock />;

                            return (
                                <article
                                    key={alerta.id_notificacion}
                                    className={`mb-2 rounded-xl border ${styles.border} ${styles.bg} p-3 transition-all duration-200`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(expanded ? null : alerta.id_notificacion)}
                                        className="flex w-full items-start justify-between gap-3 text-left"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${styles.badge}`}>
                                                <span className="text-[10px]">{badgeIcon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="truncate text-xs font-semibold text-slate-900">
                                                        {alerta.paciente.nombre} {alerta.paciente.apellido}
                                                    </p>
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
                                                        {styles.label}
                                                    </span>
                                                    {!alerta.leida && (
                                                        <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                                                            Nueva
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-slate-600">{alerta.vacuna.nombre}</p>
                                                <p className={`mt-1 text-[11px] font-bold ${styles.accent}`}>{diasLabel}</p>
                                            </div>
                                        </div>
                                        <FaChevronDown className={`mt-1 text-slate-400 text-xs shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180 text-slate-600' : ''}`} />
                                    </button>

                                    {/* Detalle Desplegado */}
                                    {expanded && (
                                        <div className="mt-3 space-y-2.5 border-t border-slate-200/50 pt-2.5 text-xs text-slate-600">
                                            <div className="grid grid-cols-2 gap-y-1 gap-x-2 bg-white/60 p-2 rounded-lg border border-slate-100">
                                                <p><span className="font-medium text-slate-900">DNI:</span> {alerta.paciente.dni || 'No disponible'}</p>
                                                <p><span className="font-medium text-slate-900">Vence:</span> {formatDate(alerta.fecha_vencimiento)}</p>
                                                <p className="col-span-2">
                                                    <span className="font-medium text-slate-900">Rango:</span>{' '}
                                                    {alerta.estado === 'vencida'
                                                        ? 'Ya vencida'
                                                        : alerta.estado === 'urgente'
                                                            ? 'Límite inmediato'
                                                            : 'Preventivo'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => marcarComoLeida(alerta)}
                                                    disabled={processingIds.includes(alerta.id_notificacion) || alerta.leida}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <FaEye className="text-[10px]" />
                                                    {alerta.leida ? 'Vista' : 'Marcar vista'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => posponer(alerta)}
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    Posponer 24h
                                                </button>

                                                                        <Link
                                                                            to={`/calendario/${alerta.pacienteId}`}
                                                                            onClick={() => {
                                                                                setOpen(false);
                                                                                onNavigate?.();
                                                                            }}
                                                                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-700 transition hover:bg-red-100/80 text-center"
                                                                        >
                                                                            Ver calendario
                                                                        </Link>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}

                        {/* Historial: mostrar elementos leídos */}
                        {!loading && !error && showHistory && historyList.length === 0 && (
                            <div className="my-6 flex flex-col items-center justify-center px-4 py-6 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white">
                                    <FaCheck className="text-lg" />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-800">Sin historial</p>
                                <p className="mt-1 text-xs text-slate-400 max-w-[220px]">No hay notificaciones leídas para mostrar.</p>
                            </div>
                        )}

                        {!loading && !error && showHistory && historyList.map((item) => (
                            <article key={item.id_notificacion} className="mb-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 overflow-hidden">
                                <div className="flex items-start justify-between min-w-0">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-900 break-words whitespace-normal">{item.mensaje}</p>
                                        <p className="mt-1 text-[11px] text-slate-600">{new Date(item.fecha).toLocaleString()}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    if (global && typeof document !== 'undefined') {
        return createPortal(bellContent, document.body);
    }

    return bellContent;
}