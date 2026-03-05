import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import instance from '@/api/axios';
import { useNotify } from '@/context/notificationContext';
import { getErrorMessage } from '@/utils/errorHandler';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const CalendarioPaciente = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const notify = useNotify();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientName, setPatientName] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvents, setSelectedEvents] = useState([]);

    const parseDateFromDB = (val) => {
        if (!val) return null;
        if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate());
        const s = String(val).split('T')[0];
        const parts = s.split('-').map((p) => Number(p));
        if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
            const [y, m, d] = parts;
            return new Date(y, m - 1, d);
        }
        const dt = new Date(val);
        if (Number.isNaN(dt.getTime())) return null;
        return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const formatDosis = (num) => {
        if (!num) return '';
        if (num === 4) return '1° Refuerzo';
        if (num === 5) return '2° Refuerzo';
        if (num === 6) return '3° Refuerzo';
        return `${num}ª Dosis`;
    };

    const getDosisInfo = (cita) => {
        if (cita.ultima_dosis_numero) return formatDosis(cita.ultima_dosis_numero);
        const match = cita.motivo?.match(/\(Dosis (\d+)\)/);
        if (match) {
            return formatDosis(parseInt(match[1], 10));
        }
        return '';
    };

    const loadCitas = async () => {
        setLoading(true);
        try {
            const { data } = await instance.get(`/citas/paciente/${id}`);

            if (data && data.length > 0) {
                const p = data[0].paciente;
                const name = p?.persona ? `${p.persona.nombre} ${p.persona.apellido}` : (p?.nombre || 'Paciente');
                setPatientName(name);
            } else {
                setPatientName('Paciente');
            }

            const todayOnly = new Date();
            todayOnly.setHours(0, 0, 0, 0);

            const mappedEvents = (data || []).map(c => {
                const fecha = parseDateFromDB(c.fecha_cita);
                const isPast = fecha && fecha < todayOnly;
                const vacunaName = c.vacuna?.nombre ?? c.vacuna?.vacunas ?? 'Vacuna';
                const dosis = getDosisInfo(c);

                return {
                    id: String(c.id_cita),
                    title: `${vacunaName} ${dosis ? `(${dosis})` : ''}`,
                    start: c.fecha_cita ? c.fecha_cita.split('T')[0] : undefined,
                    backgroundColor: isPast ? '#ef4444' : '#10b981',
                    borderColor: isPast ? '#ef4444' : '#10b981',
                    extendedProps: {
                        vacuna: vacunaName,
                        dosis: dosis,
                        estado: isPast ? 'Vencida' : 'Programada',
                        id_cita: c.id_cita
                    }
                };
            });

            setEvents(mappedEvents);

        } catch (error) {
            const message = getErrorMessage(error);
            notify.error(`❌ ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (arg) => {
        const clickedDateStr = arg.dateStr;
        const eventsForDay = events.filter(e => e.start === clickedDateStr);

        setSelectedDate(arg.date);
        setSelectedEvents(eventsForDay);
        setShowModal(true);
    };

    const handleEventClick = (clickInfo) => {
        const clickedDateStr = clickInfo.event.startStr;
        const eventsForDay = events.filter(e => e.start === clickedDateStr);

        setSelectedDate(clickInfo.event.start);
        setSelectedEvents(eventsForDay);
        setShowModal(true);
    };

    const handleDeleteFromModal = async (idCita) => {
        if (!window.confirm('¿Estás seguro de eliminar esta cita?')) return;
        try {
            await instance.delete(`/citas/${idCita}`);
            notify.success('✅ Cita eliminada correctamente');
            await loadCitas();
            setShowModal(false);
        } catch (error) {
            const message = getErrorMessage(error);
            notify.error(`❌ No se pudo eliminar la cita: ${message}`);
        }
    };

    useEffect(() => {
        if (id) loadCitas();
    }, [id]);

    // Close modal on Escape key
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setShowModal(false);
            }
        };
        if (showModal) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [showModal]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Overrides for FullCalendar links and buttons */}
            <style>{`
                .fc-daygrid-day-number, .fc-col-header-cell-cushion {
                    color: #000 !important;
                    text-decoration: none !important;
                }
                .fc-daygrid-day-number:hover, .fc-col-header-cell-cushion:hover {
                    color: #000 !important;
                    text-decoration: none !important;
                }
                /* FullCalendar Buttons Override */
                .fc-button-primary {
                    background-color: #0d6efd !important;
                    border-color: #0d6efd !important;
                }
                .fc-button-primary:hover {
                    background-color: #0b5ed7 !important;
                    border-color: #0a58ca !important;
                }
                .fc-button-primary:disabled {
                    background-color: #0d6efd !important;
                    border-color: #0d6efd !important;
                    opacity: 0.65;
                }
                .fc-button-active {
                    background-color: #0a58ca !important;
                    border-color: #0a53be !important;
                }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#212529]">Calendario de Vacunación: {patientName}</h2>
                <button
                    className="px-4 py-2 bg-[#0d6efd] text-white rounded-md hover:bg-[#0b5ed7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:ring-offset-2"
                    onClick={() => navigate(-1)}
                >
                    Volver
                </button>
            </div>

            {loading && (
                <div className="bg-[#cff4fc] border border-[#b6effb] text-[#055160] p-4 mb-4 rounded" role="alert">
                    <p>Cargando calendario...</p>
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridYear'
                    }}
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    height="auto"
                    eventContent={(arg) => {
                        return (
                            <div className="truncate p-1 cursor-pointer font-medium text-xs sm:text-sm">
                                {arg.event.title}
                            </div>
                        )
                    }}
                />
            </div>

            {/* Modal Tailwind Implementation */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[#dee2e6] flex justify-between items-center bg-white">
                            <h3 className="text-lg font-medium text-[#212529]">
                                {patientName}
                                <span className="block text-sm text-[#6c757d] font-normal mt-1">
                                    {selectedDate ? selectedDate.toLocaleDateString() : ''}
                                </span>
                            </h3>
                            <button
                                type="button"
                                className="text-[#6c757d] hover:text-[#343a40] focus:outline-none"
                                onClick={() => setShowModal(false)}
                            >
                                <span className="sr-only">Cerrar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {selectedEvents.length === 0 ? (
                                <p className="text-[#6c757d] text-center py-4">No hay vacunas programadas para este día.</p>
                            ) : (
                                <ul className="divide-y divide-[#dee2e6]">
                                    {selectedEvents.map((evt, idx) => (
                                        <li key={idx} className="py-4 flex justify-between items-start first:pt-0 last:pb-0">
                                            <div>
                                                <p className="text-sm font-medium text-[#212529]">{evt.extendedProps.vacuna}</p>
                                                <p className="text-sm text-[#6c757d]">{evt.extendedProps.dosis}</p>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${evt.extendedProps.estado === 'Vencida'
                                                    ? 'bg-[#f8d7da] text-[#842029]'
                                                    : 'bg-[#d1e7dd] text-[#0f5132]'
                                                    }`}>
                                                    {evt.extendedProps.estado}
                                                </span>
                                            </div>
                                            <button
                                                className="ml-4 px-3 py-1 border border-[#dc3545] text-[#dc3545] text-sm rounded-md hover:bg-[#dc3545] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#dc3545] focus:ring-offset-2 transition-colors"
                                                onClick={() => handleDeleteFromModal(evt.extendedProps.id_cita)}
                                            >
                                                Eliminar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#dee2e6] flex justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 bg-[#0d6efd] text-white rounded-md hover:bg-[#0b5ed7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:ring-offset-2"
                                onClick={() => setShowModal(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarioPaciente;
