import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usersApi, calendarApi } from '../Api';
import { searchUsers } from '../Api/users';
import * as calendarServices from '../Api/calendar';
import './Calendar.css';

// ✅ Funciones helper movidas fuera del componente para evitar recreación en cada render
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    case 'pending':
    default:
      return 'primary';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    case 'pending':
    default:
      return 'Pendiente';
  }
};

const Calendar = () => {
  // Helpers de fecha/hora para zona Bogotá
  const TZ = 'America/Bogota';
  const pad2 = (n) => String(n).padStart(2, '0');
  const toLocalYMD = (d) => {
    // Construye YYYY-MM-DD en hora local sin depender de ISO (que puede desfasar por UTC)
    const year = d.getFullYear();
    const month = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${year}-${month}-${day}`;
  };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const parseYMDToLocalDate = (ymd) => {
    if (!ymd || typeof ymd !== 'string') return null;
    const parts = ymd.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [yyyy, mm, dd] = parts;
    return new Date(yyyy, mm - 1, dd);
  };

  // Asegurar que el calendario inicie en el mes actual
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [selectedDaySelectedIds, setSelectedDaySelectedIds] = useState([]);
  const [monthTasks, setMonthTasks] = useState([]); // Tareas del mes completo
  const [expandedDays, setExpandedDays] = useState(new Set()); // Días con acordeón expandido
  const [showAllTasksModal, setShowAllTasksModal] = useState(false); // Modal con todas las tareas del mes
  
  // Estado para el modal de nueva tarea
  const [newTask, setNewTask] = useState({
    clientName: '',
    clientId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    veterinarian: '',
    location: '',
    description: '',
    status: 'pending',
    templateId: '' // Se establecerá cuando se carguen los templates
  });

  // Estado para las tareas
  const [tasks, setTasks] = useState([]);
  
  // Estado para templates
  const [templates, setTemplates] = useState([]);
  
  // Estado para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    today: 0
  });

  // Normalizar una tarea a la forma interna esperada por el calendario
  const normalizeTask = (rawTask) => {
    if (!rawTask || typeof rawTask !== 'object') return null;

    const startDateStr = rawTask.start?.date || rawTask.start_date || (rawTask.start_datetime ? String(rawTask.start_datetime).split(' ')[0] : undefined);
    const startTimeStr = rawTask.start?.dateTime ? String(rawTask.start.dateTime).split(' ')[1] : rawTask.start_time;
    const endDateStr = rawTask.end?.date || rawTask.end_date || (rawTask.end_datetime ? String(rawTask.end_datetime).split(' ')[0] : startDateStr);
    const endTimeStr = rawTask.end?.dateTime ? String(rawTask.end.dateTime).split(' ')[1] : rawTask.end_time;

    const startDateTime = rawTask.start?.dateTime
      || (startDateStr && startTimeStr ? `${startDateStr} ${startTimeStr}` : undefined)
      || rawTask.start_datetime
      || rawTask.startDateTime;

    const endDateTime = rawTask.end?.dateTime
      || (endDateStr && endTimeStr ? `${endDateStr} ${endTimeStr}` : undefined)
      || rawTask.end_datetime
      || rawTask.endDateTime;

    const summary = rawTask.summary
      || rawTask.name
      || rawTask.task_name
      || rawTask.taskName
      || rawTask.description
      || 'Evento';

    const clientName = rawTask.clientName
      || rawTask.client_name
      || rawTask.client?.full_name
      || rawTask.client_full_name
      || '';

    return {
      ...rawTask,
      summary,
      clientName,
      client_name: clientName, // Mantener ambos para compatibilidad
      taskName: rawTask.taskName || rawTask.task_name || summary,
      taskType: rawTask.taskType || rawTask.task_type || rawTask.type,
      start: {
        date: startDateStr || (startDateTime ? String(startDateTime).split(' ')[0] : ''),
        dateTime: startDateTime,
      },
      end: {
        date: endDateStr || (endDateTime ? String(endDateTime).split(' ')[0] : (startDateStr || '')),
        dateTime: endDateTime,
      },
      // Preservar campos del nuevo formato del API
      start_date: startDateStr,
      start_time: startTimeStr,
      end_date: endDateStr,
      end_time: endTimeStr,
      color_background: rawTask.color_background || rawTask.color?.background,
      color_foreground: rawTask.color_foreground || rawTask.color?.foreground,
      color: {
        background: rawTask.color_background || rawTask.color?.background || '#e3f2fd',
        foreground: rawTask.color_foreground || rawTask.color?.foreground || '#0d47a1'
      }
    };
  };

  const normalizeTasksArray = (arr) => (Array.isArray(arr) ? arr.map(normalizeTask).filter(Boolean) : []);

  // Cargar clientes y tareas
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar clientes (rol 3)
        const clientsResponse = await searchUsers({ role_id: 3 }, 0, 1000);
        setClients(Array.isArray(clientsResponse) ? clientsResponse : []);
        
        // No cargar tareas inicialmente. Se cargarán cuando el usuario seleccione/busque un cliente
        setTasks([]);
        setFilteredTasks([]);
        
        // Cargar templates disponibles
        const templatesResponse = await calendarServices.getTemplates(0, 100, true);
        const templatesArray = Array.isArray(templatesResponse.data) ? templatesResponse.data : [];
        setTemplates(templatesArray);
        
        // Si no hay templates, crear uno por defecto
        if (templatesArray.length === 0) {
          console.warn('No se encontraron templates, creando uno por defecto');
          try {
            const defaultTemplate = await calendarServices.createTemplate({
              name: 'Template Semanal',
              description: 'Template por defecto para tareas semanales',
              is_active: true
            });
            if (defaultTemplate && defaultTemplate.id) {
              setTemplates([defaultTemplate]);
            } else {
              console.error('No se pudo crear el template por defecto');
            }
          } catch (err) {
            console.error('Error creando template por defecto:', err);
          }
        }
        
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos del calendario");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Efecto para buscar clientes
  useEffect(() => {
    const searchClient = async () => {
        if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
          // Sin cliente seleccionado, no mostrar tareas
          if (!selectedClient) setFilteredTasks([]);
        return;
      }

      try {
        console.log('Buscando clientes con:', searchQuery);
        const results = await searchUsers({ 
          q: searchQuery, 
          role_id: 3 // Cambiado a 3 que es el ID correcto para clientes
        }, 0, 10);
        
        console.log('Resultados de búsqueda:', results);
        
        if (Array.isArray(results) && results.length > 0) {
          setSearchResults(results);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch (err) {
        console.error("Error al buscar clientes:", err);
        setSearchResults([]);
        setShowDropdown(false);
      }
    };

    if (searchQuery.trim().length >= 2) {
      const debounceTimeout = setTimeout(searchClient, 300);
      return () => clearTimeout(debounceTimeout);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]); // ✅ Removida dependencia innecesaria 'tasks'

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.search-input')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Función para seleccionar un cliente
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearchQuery(client.full_name);
    setShowDropdown(false);
    
    // Filtrar tareas por cliente usando el servicio
    loadClientTasks(client.id);
  };

  // Cargar tareas de un cliente específico - MEMOIZADA
  const loadClientTasks = useCallback(async (clientId) => {
    try {
      const startDate = toLocalYMD(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      const endDate = toLocalYMD(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
      
      const clientTasks = await calendarServices.getClientTasks(clientId, startDate, endDate);
      const normalized = normalizeTasksArray(clientTasks);
      setTasks(normalized);
      setFilteredTasks(normalized);
    } catch (err) {
      console.error("Error cargando tareas del cliente:", err);
      // Fallback a filtrado local
      const clientTasks = (tasks || []).filter(task => 
        task.clientName.toLowerCase().includes(selectedClient.full_name.toLowerCase())
      );
      setTasks(clientTasks);
      setFilteredTasks(clientTasks);
    }
  }, [currentDate, tasks, selectedClient]); // ✅ Memoizada con todas las dependencias

  // Generar sufijo único para el cliente
  const generateTaskSuffix = (clientName) => {
    const existingTasks = tasks.filter(task => 
      task.clientName.toLowerCase() === clientName.toLowerCase()
    );
    return `${clientName.replace(/\s+/g, '_').toLowerCase()}_task_${existingTasks.length + 1}`;
  };

  // Generar tareas semanales localmente como fallback
  const generateWeeklyTasks = (startDate, clientName, veterinarian, location, taskSuffix) => {
    const start = parseYMDToLocalDate(startDate); // Usar el helper para evitar problemas de TZ
    const tasks = [];

    // Definir las tareas según la nueva lógica
    const weeklyTasksConfig = [
      { dayOffset: 0, name: 'OPUS', type: 'opus' },
      { dayOffset: 1, name: 'Día 0', type: 'd0' },
      { dayOffset: 2, name: 'Día 1', type: 'd1' },
      { dayOffset: 3, name: 'Día 2', type: 'd2' },
      { dayOffset: 4, name: 'Día 3', type: 'd3' },
      { dayOffset: 5, name: 'Día 4', type: 'd4' },
      { dayOffset: 6, name: 'Día 5', type: 'd5' },
      { dayOffset: 7, name: 'Día 6', type: 'd6' },
      { dayOffset: 8, name: 'Día 7', type: 'd7' },
    ];

    weeklyTasksConfig.forEach((taskConfig, index) => {
      const taskDate = new Date(start);
      taskDate.setDate(start.getDate() + taskConfig.dayOffset);
      
      tasks.push({
        summary: taskConfig.name,
        description: `${taskConfig.name} para ${clientName}`,
        clientName: clientName,
        taskName: taskConfig.name,
        taskType: taskConfig.type,
        start: {
          date: toLocalYMD(taskDate),
          dateTime: `${toLocalYMD(taskDate)} 09:00`
        },
        end: {
          date: toLocalYMD(taskDate),
          dateTime: `${toLocalYMD(taskDate)} 17:00`
        },
        veterinarian: veterinarian,
        location: location,
        status: 'pending',
        suffix: taskSuffix,
      });
    });

    return tasks;
  };

  // Manejar creación de nueva tarea
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.clientName || !newTask.startDate || !newTask.veterinarian || !newTask.location) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (!newTask.clientId) {
      setError("Debe seleccionar un cliente");
      return;
    }

    if (!newTask.templateId) {
      setError("Debe seleccionar un template. Si no hay templates disponibles, se creará uno por defecto.");
      return;
    }

    // Validar formato de fecha
    if (!newTask.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(newTask.startDate)) {
      setError("Fecha de inicio inválida");
      return;
    }

    // Validar que la fecha no sea anterior a hoy
    const today = new Date();
    const startDate = parseYMDToLocalDate(newTask.startDate);
    
    // Normalizar ambas fechas al inicio del día para comparación correcta (zona local)
    const todayStart = startOfDay(today);
    const startDateStart = startOfDay(startDate);
    
    if (startDateStart < todayStart) {
      setError("La fecha de inicio no puede ser anterior a hoy");
      return;
    }

    try {
      setLoading(true);
      
      const taskSuffix = generateTaskSuffix(newTask.clientName);
      const tasksToCreate = generateWeeklyTasks(
        newTask.startDate,
        newTask.clientName,
        newTask.veterinarian,
        newTask.location,
        taskSuffix
      );

      const creationPromises = tasksToCreate.map(task => {
        const taskData = {
          client_id: parseInt(newTask.clientId),
          client_name: task.clientName,
          task_name: task.taskName,
          task_type: task.taskType,
          summary: task.summary,
          description: task.description,
          start_date: task.start.date,
          start_time: '09:00',
          end_date: task.end.date,
          end_time: '17:00',
          veterinarian: task.veterinarian,
          location: task.location,
          status: 'pending',
          suffix: task.suffix,
          created_by: 1, // TODO: ID de usuario
        };
        return calendarServices.createTask(taskData);
      });

      const createdTasksResponses = await Promise.all(creationPromises);
      const createdTasks = createdTasksResponses.map(res => res.data || res);

      const normalizedNewTasks = normalizeTasksArray(createdTasks);
      
      if (normalizedNewTasks.length > 0) {
        setTasks(prev => [...prev, ...normalizedNewTasks]);
        setFilteredTasks(prev => [...prev, ...normalizedNewTasks]);
        setMonthTasks(prev => [...prev, ...normalizedNewTasks]);
        
        // Si hay un día seleccionado y el modal está abierto, actualizar sus tareas
        if (selectedDay && showDayModal) {
          const dateStr = toLocalYMD(selectedDay);
          const updatedDayTasks = getDayTasks(selectedDay);
          setSelectedDayTasks(updatedDayTasks);
        }
        
        // Recargar tareas del mes para asegurar sincronización
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        try {
          const monthTasksData = await calendarServices.getTasksByMonth(year, month);
          const normalized = normalizeTasksArray(monthTasksData);
          setMonthTasks(normalized);
          if (!selectedClient) {
            setFilteredTasks(normalized);
          } else {
            // Si hay cliente seleccionado, filtrar las nuevas tareas
            const clientTasks = normalized.filter(t => 
              t.client_id === parseInt(newTask.clientId) || 
              (t.client_name || t.clientName || t.client?.full_name) === newTask.clientName
            );
            setFilteredTasks(clientTasks);
          }
        } catch (err) {
          console.error("Error recargando tareas del mes:", err);
        }
      } else {
        console.warn('La API no devolvió tareas creadas, pero la operación pudo haber sido exitosa.');
      }

      // Limpiar formulario
      setNewTask({
        clientName: '',
        clientId: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        veterinarian: '',
        location: '',
        description: '',
        status: 'pending',
        templateId: templates.length > 0 ? templates[0].id.toString() : ''
      });

      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error("Error al crear tareas:", err);
      console.error("Error response:", err.response);
      
      // Manejar diferentes tipos de errores
      let errorMessage = "Error al crear las tareas";
      
      if (err.response?.status === 422) {
        // Error de validación
        if (err.response.data?.detail) {
          if (Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail.map(error => {
              if (error.loc && error.loc.includes('template_id')) {
                return 'Debe seleccionar un template válido';
              }
              return typeof error === 'object' ? error.msg : error;
            }).join(', ');
          } else {
            errorMessage = typeof err.response.data.detail === 'string' 
              ? err.response.data.detail 
              : JSON.stringify(err.response.data.detail);
          }
        } else {
          errorMessage = "Datos de entrada inválidos. Por favor, verifica la información.";
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error("Error message to display:", errorMessage);
      setError(errorMessage);
      
      // Limpiar el error después de 5 segundos
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Función helper para obtener todas las tareas de un día específico
  const getDayTasks = (date) => {
    const dateStr = toLocalYMD(date);
    // Si hay cliente seleccionado, usar filteredTasks, sino usar monthTasks
    const sourceTasks = selectedClient ? filteredTasks : monthTasks;
    return (sourceTasks || []).filter(task => {
      if (!task) return false;
      const taskDate = task.start_date || task.start?.date;
      if (!taskDate) return false;
      return taskDate === dateStr;
    });
  };
  
  // Agrupar tareas por día
  const groupTasksByDay = (tasks) => {
    const grouped = {};
    tasks.forEach(task => {
      const dateStr = task.start_date || task.start?.date;
      if (dateStr) {
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(task);
      }
    });
    return grouped;
  };
  
  // Toggle acordeón de un día
  const toggleDayAccordion = (dateStr) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  // Obtener tareas para una fecha específica (solo para visualización en la casilla)
  const getTasksForDate = (date) => {
    const dayTasks = getDayTasks(date);
    // Mostrar como mucho 1 tarea en la celda para evitar saturación visual
    return dayTasks.slice(0, 1);
  };

  // Generar calendario del mes
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    const currentDateObj = new Date(startDate);

    while (currentDateObj <= lastDay || calendar.length < 42) {
      calendar.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return calendar;
  };

  // Navegar al mes anterior
  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Ir a hoy
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Cambiar vista
  const changeView = (newView) => {
    setView(newView);
  };

  // Limpiar filtros y calendario
  const clearFilters = () => {
    setSelectedClient(null);
    setSearchQuery('');
    setShowDropdown(false);
    setTasks([]);
    setFilteredTasks([]);
    setMonthTasks([]);
    setExpandedDays(new Set());
    setSelectedDay(null);
    setSelectedDayTasks([]);
    setSelectedDaySelectedIds([]);
    setShowDayModal(false);
    setSelectedEvent(null);
    setShowEventModal(false);
    setError(null);
  };

  // Abrir modal para nueva tarea
  const openNewTaskModal = (date) => {
    setSelectedDate(date);
    setNewTask(prev => ({
      ...prev,
      startDate: toLocalYMD(date),
      endDate: toLocalYMD(date)
    }));
    setShowModal(true);
  };

  // ✅ Abrir modal de evento - Memoizado
  const openEventModal = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  // ✅ Handler memoizado para click en tarea
  const handleTaskClick = useCallback((task) => {
    openEventModal(task);
  }, [openEventModal]);

  // Cambiar estado de una tarea
  const toggleTaskStatus = async (taskId) => {
    try {
      const updatedTask = await calendarServices.toggleTaskStatus(taskId);
      const updateTaskInState = (prev) => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: updatedTask.status }
          : task
      );
      
      setTasks(updateTaskInState);
      setFilteredTasks(updateTaskInState);
      setMonthTasks(updateTaskInState);
      setSelectedDayTasks(updateTaskInState);
    } catch (err) {
      console.error("Error al cambiar estado de tarea:", err);
      setError("Error al cambiar el estado de la tarea");
    }
  };

  // Eliminar tarea
  const deleteTask = async (taskId) => {
    if (window.confirm('¿Está seguro de eliminar esta tarea?')) {
      try {
        await calendarServices.deleteTask(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setFilteredTasks(prev => prev.filter(task => task.id !== taskId));
        setShowEventModal(false);
      } catch (err) {
        console.error("Error al eliminar tarea:", err);
        setError("Error al eliminar la tarea");
      }
    }
  };

  // ✅ Funciones getStatusColor y getStatusText movidas fuera del componente

  // Exportar tareas del calendario
  const exportCalendarTasks = async () => {
    try {
      const startDate = toLocalYMD(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      const endDate = toLocalYMD(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
      
      const filters = {
        start_date: startDate,
        end_date: endDate,
        client_id: selectedClient?.id
      };
      
      await calendarServices.exportAndDownloadTasks(filters, `tareas_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.csv`);
    } catch (err) {
      console.error("Error exportando tareas:", err);
      setError("Error al exportar las tareas");
    }
  };

  // Buscar tareas usando el servicio de búsqueda
  const searchTasksByCriteria = async (criteria) => {
    try {
      const searchResults = await calendarServices.searchTasks(criteria, 0, 1000);
      const resultsArray = Array.isArray(searchResults.data) ? searchResults.data : [];
      setFilteredTasks(normalizeTasksArray(resultsArray));
    } catch (err) {
      console.error("Error buscando tareas:", err);
      setError("Error al buscar tareas");
    }
  };

  // Calcular estadísticas - MEMOIZADA
  const calculateStats = useCallback(() => {
    const today = toLocalYMD(new Date());
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const todayTasks = safeTasks.filter(task => task?.start?.date === today);
    
    setStats({
      total: safeTasks.length,
      pending: safeTasks.filter(task => task?.status === 'pending').length,
      completed: safeTasks.filter(task => task?.status === 'completed').length,
      today: todayTasks.length
    });
  }, [tasks]); // ✅ Memoizada con dependencia tasks

  // Obtener estadísticas del servidor
  const fetchCalendarStats = async () => {
    try {
      const startDate = toLocalYMD(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      const endDate = toLocalYMD(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
      
      const statsResponse = await calendarServices.getCalendarStats(startDate, endDate);
      if (statsResponse.data) {
        setStats({
          total: statsResponse.data.total_tasks || 0,
          pending: statsResponse.data.pending_tasks || 0,
          completed: statsResponse.data.completed_tasks || 0,
          today: statsResponse.data.today_tasks || 0
        });
      }
    } catch (err) {
      console.error("Error obteniendo estadísticas:", err);
      // Si falla, usar estadísticas locales
      calculateStats();
    }
  };

  // Actualizar estadísticas cuando cambian las tareas
  useEffect(() => {
    calculateStats();
  }, [tasks, calculateStats]); // ✅ Agregado calculateStats

  // Cargar tareas del mes cuando cambia el mes o cuando no hay cliente seleccionado
  // Usar valores primitivos para evitar re-renders innecesarios
  const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const currentMonth = useMemo(() => currentDate.getMonth() + 1, [currentDate]);
  
  useEffect(() => {
    const loadMonthTasks = async () => {
      try {
        const year = currentYear;
        const month = currentMonth;
        
        if (!selectedClient) {
          // Si no hay cliente seleccionado, cargar todas las tareas del mes
          setLoading(true);
          const monthTasksData = await calendarServices.getTasksByMonth(year, month);
          const normalized = normalizeTasksArray(monthTasksData);
          setMonthTasks(normalized);
          setFilteredTasks(normalized);
        } else {
          // Si hay cliente seleccionado, cargar solo sus tareas
          await loadClientTasks(selectedClient.id);
        }
      } catch (err) {
        console.error("Error cargando tareas del mes:", err);
        setError("Error al cargar las tareas del mes");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendarStats();
    loadMonthTasks();
  }, [currentYear, currentMonth, selectedClient, loadClientTasks]); // ✅ Valores primitivos y loadClientTasks

  // Establecer template por defecto cuando se cargan los templates
  useEffect(() => {
    if (templates.length > 0 && !newTask.templateId) {
      setNewTask(prev => ({
        ...prev,
        templateId: templates[0].id.toString()
      }));
    }
  }, [templates]);

  const calendar = generateCalendar();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando calendario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Header minimalista */}
      <div className="calendar-header">
        <div className="calendar-nav">
          {/* Icono de ojo para ver todas las tareas del mes */}
          <button 
            className="calendar-nav-btn" 
            onClick={async () => {
              try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                const monthTasksData = await calendarServices.getTasksByMonth(year, month);
                const normalized = normalizeTasksArray(monthTasksData);
                setMonthTasks(normalized);
                setShowAllTasksModal(true);
              } catch (err) {
                console.error("Error cargando tareas del mes:", err);
                setError("Error al cargar las tareas del mes");
              }
            }}
            title="Ver todas las tareas del mes"
          >
            <i className="bi bi-eye"></i>
          </button>
          <button className="calendar-nav-btn" onClick={previousMonth}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="calendar-nav-btn today-btn" onClick={goToToday}>
            Hoy
          </button>
          <button className="calendar-nav-btn" onClick={nextMonth}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>

        <div className="calendar-title">
          <h1>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h1>
          <div className="calendar-search">
            <div className="search-input">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
              />
              {selectedClient && (
                <button 
                  className="clear-search"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedClient(null);
                    setFilteredTasks([]);
                    setExpandedDays(new Set());
                    setShowDropdown(false);
                    // Recargar tareas del mes completo
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth() + 1;
                    calendarServices.getTasksByMonth(year, month)
                      .then(data => {
                        const normalized = normalizeTasksArray(data);
                        setMonthTasks(normalized);
                        setFilteredTasks(normalized);
                      })
                      .catch(err => console.error("Error recargando tareas:", err));
                  }}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
              
              {/* Lista desplegable de resultados */}
              {showDropdown && (
                <div className="search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((client) => (
                      <div
                        key={client.id}
                        className="search-result-item"
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className="client-info">
                          <span className="client-name">{client.full_name}</span>
                          <span className="client-email">{client.email}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="search-result-item no-results">
                      No se encontraron clientes
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="calendar-controls">
          <button
            className="calendar-export-btn"
            onClick={clearFilters}
            title="Limpiar filtros"
          >
            <i className="bi bi-eraser"></i>
          </button>
          <button
            className="calendar-export-btn"
            onClick={() => exportCalendarTasks()}
            title="Exportar tareas del mes"
          >
            <i className="bi bi-download"></i>
          </button>
          <button
            className="calendar-add-btn"
            onClick={() => openNewTaskModal(new Date())}
          >
            <i className="bi bi-plus"></i>
            Nuevo Evento
          </button>
        </div>
      </div>

      {/* Calendario minimalista */}
      <div className="calendar-grid">
        {/* Días de la semana */}
        <div className="calendar-weekdays">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="calendar-days">
          {calendar.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = toLocalYMD(date) === toLocalYMD(new Date());
            const dateStr = toLocalYMD(date);
            const allDayTasks = getDayTasks(date);
            const isExpanded = expandedDays.has(dateStr);
            const maxVisible = 5;
            const visibleTasks = isExpanded ? allDayTasks : allDayTasks.slice(0, maxVisible);
            const hasMore = allDayTasks.length > maxVisible;
            
            return (
              <div
                key={`day-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                className={`calendar-day ${
                  !isCurrentMonth ? 'other-month' : ''
                } ${isToday ? 'today' : ''}`}
                onClick={(e) => {
                  // Solo abrir modal si se hace clic en el área del día, no en tareas, botones o iconos
                  if (e.target.closest('.event-item') || 
                      e.target.closest('.day-add-btn') || 
                      e.target.closest('.day-view-btn') ||
                      e.target.closest('.btn') ||
                      e.target.closest('button')) {
                    return;
                  }
                  // Ya no abrimos el modal automáticamente, solo con el icono de ojo
                }}
              >
                <div className="day-header">
                  <div className="day-number-container">
                    <span className="day-number">{date.getDate()}</span>
                    {isToday && (
                      <div className="today-indicator">
                        <i className="bi bi-check-circle-fill today-check"></i>
                      </div>
                    )}
                    {allDayTasks.length > 0 && (
                      <span className="badge bg-primary badge-sm ms-1" style={{ fontSize: '0.65rem' }}>
                        {allDayTasks.length}
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-1">
                    {allDayTasks.length > 0 && (
                      <button
                        className="day-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(date);
                          setSelectedDayTasks(allDayTasks);
                          setSelectedDaySelectedIds([]);
                          setShowDayModal(true);
                        }}
                        title="Ver todas las tareas del día"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0d6efd',
                          padding: '2px 6px',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    )}
                    <button
                      className="day-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewTaskModal(date);
                      }}
                      title="Agregar evento"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
                
                {/* Eventos del día con acordeón */}
                {allDayTasks.length > 0 && (
                  <div className="day-events">
                    <div className="accordion accordion-flush" id={`accordion-${dateStr}`}>
                      {visibleTasks.map((task, taskIndex) => {
                        const taskId = task.id || `task-${dateStr}-${taskIndex}`;
                        const clientName = task.client_name || task.clientName || task.client?.full_name || 'Sin cliente';
                        const taskSummary = task.summary || task.task_name || 'Tarea';
                        const taskStatus = task.status || 'pending';
                        const backgroundColor = task.color_background || task.color?.background || '#e3f2fd';
                        const foregroundColor = task.color_foreground || task.color?.foreground || '#0d47a1';
                        
                        return (
                          <div
                            key={taskId}
                            className={`accordion-item event-item ${taskStatus === 'completed' ? 'completed' : ''} status-${taskStatus}`}
                            style={{ 
                              backgroundColor: backgroundColor,
                              color: foregroundColor,
                              border: 'none',
                              marginBottom: '2px',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Abrir modal de detalles de la tarea
                              openEventModal(task);
                            }}
                          >
                            <div className="accordion-header">
                              <div className="d-flex align-items-center justify-content-between w-100 p-1">
                                <div className="flex-grow-1" style={{ fontSize: '0.75rem' }}>
                                  <div className="fw-bold">{taskSummary}</div>
                                  <div className="small" style={{ opacity: 0.8 }}>
                                    {clientName}
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                  {task.start_time && (
                                    <small style={{ fontSize: '0.7rem' }}>
                                      {task.start_time.substring(0, 5)}
                                    </small>
                                  )}
                                  <i className={`bi ${taskStatus === 'completed' ? 'bi-check-circle-fill text-success' : 'bi-circle text-primary'}`} style={{ fontSize: '0.7rem' }}></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Botón "Ver más" si hay más tareas */}
                    {hasMore && !isExpanded && (
                      <button
                        className="btn btn-sm btn-link p-0 mt-1 w-100 text-start"
                        style={{ fontSize: '0.7rem', textDecoration: 'none' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDayAccordion(dateStr);
                        }}
                      >
                        <i className="bi bi-chevron-down me-1"></i>
                        Ver {allDayTasks.length - maxVisible} más
                      </button>
                    )}
                    
                    {/* Botón "Ver menos" si está expandido */}
                    {hasMore && isExpanded && (
                      <button
                        className="btn btn-sm btn-link p-0 mt-1 w-100 text-start"
                        style={{ fontSize: '0.7rem', textDecoration: 'none' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDayAccordion(dateStr);
                        }}
                      >
                        <i className="bi bi-chevron-up me-1"></i>
                        Ver menos
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen de estadísticas minimalista */}
      <div className="calendar-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pendientes</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completadas</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Hoy</span>
          <span className="stat-value">{stats.today}</span>
        </div>
      </div>

      {/* Modal del día: muestra todas las tareas del cliente para ese día */}
      {showDayModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-event me-2"></i>
                  Tareas del {selectedDay?.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} 
                  {selectedClient ? ` - ${selectedClient.full_name}` : ' (Todos los clientes)'}
                  <span className="badge bg-primary ms-2">
                    {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'tarea' : 'tareas'}
                  </span>
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDayModal(false)}></button>
              </div>
              <div className="modal-body">
                {selectedDayTasks.length === 0 ? (
                  <div className="alert alert-info mb-0">No hay tareas para este día.</div>
                ) : (
                  <div className="list-group">
                    {selectedDayTasks.map(t => {
                      const clientName = t.client_name || t.clientName || t.client?.full_name || 'Sin cliente';
                      const taskSummary = t.summary || t.task_name || 'Tarea';
                      
                      return (
                      <div 
                        key={t.id} 
                        className="list-group-item list-group-item-action"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleTaskClick(t)}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedDaySelectedIds.includes(t.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedDaySelectedIds(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id));
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                        <div>
                          <div className="fw-bold d-flex align-items-center gap-2">
                            {taskSummary}
                            {t.status === 'completed' && <i className="bi bi-check-circle-fill text-success"></i>}
                          </div>
                          <div className="small text-muted">
                            {clientName} • {(t.start_time || (t?.start?.dateTime && new Date(t.start.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))) || 'Sin hora'}
                          </div>
                        </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge bg-${getStatusColor(t.status)}`}>{getStatusText(t.status)}</span>
                            <button 
                              className="btn btn-sm btn-outline-primary" 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventModal(t);
                              }}
                            >
                              Ver detalle
                            </button>
                            <button
                              className={`btn btn-sm ${t.status === 'completed' ? 'btn-warning' : 'btn-success'}`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const updated = await calendarServices.toggleTaskStatus(t.id);
                                  setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: updated.status } : x));
                                  setFilteredTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: updated.status } : x));
                                  setSelectedDayTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: updated.status } : x));
                                  setMonthTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: updated.status } : x));
                                } catch (err) {
                                  console.error('Error cambiando estado:', err);
                                  setError('No se pudo cambiar el estado.');
                                }
                              }}
                            >
                              {t.status === 'completed' ? 'Marcar pendiente' : 'Marcar completada'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm('¿Eliminar esta tarea?')) return;
                                try {
                                  await calendarServices.deleteTask(t.id);
                                  const removeTask = (prev) => prev.filter(x => x.id !== t.id);
                                  
                                  setTasks(removeTask);
                                  setFilteredTasks(removeTask);
                                  setSelectedDayTasks(removeTask);
                                  setMonthTasks(removeTask);
                                  
                                  // Recargar tareas del mes para asegurar sincronización
                                  const year = currentDate.getFullYear();
                                  const month = currentDate.getMonth() + 1;
                                  if (!selectedClient) {
                                    const monthTasksData = await calendarServices.getTasksByMonth(year, month);
                                    const normalized = normalizeTasksArray(monthTasksData);
                                    setMonthTasks(normalized);
                                    setFilteredTasks(normalized);
                                  }
                                } catch (err) {
                                  console.error('Error eliminando:', err);
                                  setError('No se pudo eliminar la tarea.');
                                }
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <div className="me-auto">
                  <button
                    type="button"
                    className="btn btn-outline-danger me-2"
                    disabled={selectedDaySelectedIds.length === 0}
                    onClick={async () => {
                      if (selectedDaySelectedIds.length === 0) return;
                      if (!window.confirm(`¿Eliminar ${selectedDaySelectedIds.length} tareas seleccionadas?`)) return;
                      try {
                        await calendarServices.deleteMultipleTasks(selectedDaySelectedIds);
                        const removeTasks = (prev) => prev.filter(x => !selectedDaySelectedIds.includes(x.id));
                        
                        setTasks(removeTasks);
                        setFilteredTasks(removeTasks);
                        setSelectedDayTasks(removeTasks);
                        setMonthTasks(removeTasks);
                        setSelectedDaySelectedIds([]);
                        
                        // Recargar tareas del mes para asegurar sincronización
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth() + 1;
                        if (!selectedClient) {
                          const monthTasksData = await calendarServices.getTasksByMonth(year, month);
                          const normalized = normalizeTasksArray(monthTasksData);
                          setMonthTasks(normalized);
                          setFilteredTasks(normalized);
                        }
                      } catch (err) {
                        console.error('Error eliminando en lote:', err);
                        setError('No se pudieron eliminar las tareas seleccionadas.');
                      }
                    }}
                  >
                    Eliminar seleccionadas
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    disabled={selectedDaySelectedIds.length === 0}
                    onClick={async () => {
                      if (selectedDaySelectedIds.length === 0) return;
                      try {
                        await calendarServices.updateMultipleTaskStatus(selectedDaySelectedIds, 'completed');
                        setTasks(prev => prev.map(x => selectedDaySelectedIds.includes(x.id) ? { ...x, status: 'completed' } : x));
                        setFilteredTasks(prev => prev.map(x => selectedDaySelectedIds.includes(x.id) ? { ...x, status: 'completed' } : x));
                        setSelectedDayTasks(prev => prev.map(x => selectedDaySelectedIds.includes(x.id) ? { ...x, status: 'completed' } : x));
                        setSelectedDaySelectedIds([]);
                      } catch (err) {
                        console.error('Error actualizando estado en lote:', err);
                        setError('No se pudo actualizar el estado de las tareas seleccionadas.');
                      }
                    }}
                  >
                    Marcar seleccionadas como completadas
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDayModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para nuevo evento */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Agregar Evento - {selectedDate?.toLocaleDateString()}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {typeof error === 'string' ? error : JSON.stringify(error)}
                      </div>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError(null)}
                      ></button>
                    </div>
                  )}

                                     <div className="row">
                     <div className="col-md-6">
                       <div className="mb-3">
                         <label className="form-label">Cliente</label>
                         <select
                           className="form-select"
                           value={newTask.clientId}
                           onChange={(e) => {
                             const client = clients.find(c => c.id === parseInt(e.target.value));
                             setNewTask(prev => ({
                               ...prev,
                               clientId: e.target.value,
                               clientName: client ? client.full_name : ''
                             }));
                           }}
                           required
                         >
                           <option value="">Seleccione un cliente</option>
                           {clients.map(client => (
                             <option key={client.id} value={client.id}>
                               {client.full_name}
                             </option>
                           ))}
                         </select>
                       </div>
                     </div>
                     <div className="col-md-6">
                       <div className="mb-3">
                         <label className="form-label">Veterinario</label>
                         <input
                           type="text"
                           className="form-control"
                           value={newTask.veterinarian}
                           onChange={(e) => setNewTask(prev => ({
                             ...prev,
                             veterinarian: e.target.value
                           }))}
                           placeholder="Nombre del veterinario"
                           required
                         />
                       </div>
                     </div>
                   </div>

                   <div className="row">
                     <div className="col-md-6">
                       <div className="mb-3">
                         <label className="form-label">Template</label>
                         <select
                           className="form-select"
                           value={newTask.templateId}
                           onChange={(e) => setNewTask(prev => ({
                             ...prev,
                             templateId: e.target.value
                           }))}
                           required
                         >
                           <option value="">Seleccione un template</option>
                           {templates.map(template => (
                             <option key={template.id} value={template.id}>
                               {template.name || `Template ${template.id}`}
                             </option>
                           ))}
                         </select>
                       </div>
                     </div>
                     <div className="col-md-6">
                       <div className="mb-3">
                         <label className="form-label">Ubicación</label>
                         <input
                           type="text"
                           className="form-control"
                           value={newTask.location}
                           onChange={(e) => setNewTask(prev => ({
                             ...prev,
                             location: e.target.value
                           }))}
                           placeholder="Ubicación donde se realizará el proceso"
                           required
                         />
                       </div>
                     </div>
                   </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fecha de Inicio</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newTask.startDate}
                          onChange={(e) => setNewTask(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fecha de Fin</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newTask.endDate}
                          onChange={(e) => setNewTask(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  </div>



                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      placeholder="Descripción detallada del evento"
                    ></textarea>
                  </div>

                                     <div className="alert alert-info">
                     <i className="bi bi-info-circle me-2"></i>
                     <strong>Nota:</strong> Se crearán automáticamente las tareas según el template seleccionado. 
                     {templates.length === 0 && (
                       <span className="text-warning">
                         <br />No hay templates disponibles. Se creará uno por defecto.
                       </span>
                     )}
                     {newTask.templateId && templates.length > 0 && (
                       <div className="mt-2">
                         <strong>Template seleccionado:</strong> {
                           templates.find(t => t.id === parseInt(newTask.templateId))?.name || `Template ${newTask.templateId}`
                         }
                       </div>
                     )}
                   </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Crear Eventos
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de evento */}
      {showEventModal && selectedEvent && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-check me-2"></i>
                  Detalles del Evento
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEventModal(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Información General</h6>
                    <div className="mb-3">
                      <label className="form-label fw-bold">ID de Tarea:</label>
                      <p className="mb-0">#{selectedEvent.id}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Evento/Tarea:</label>
                      <p className="mb-0">{selectedEvent.summary || selectedEvent.task_name || 'Sin nombre'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Tipo de Tarea:</label>
                      <p className="mb-0">
                        <span className="badge bg-info">
                          {selectedEvent.task_type || selectedEvent.taskType || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Estado:</label>
                      <span className={`badge bg-${getStatusColor(selectedEvent.status)} ms-2`}>
                        {getStatusText(selectedEvent.status)}
                      </span>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Fecha de Inicio:</label>
                      <p className="mb-0">
                        {selectedEvent.start_date || selectedEvent?.start?.date 
                          ? new Date(selectedEvent.start_date || selectedEvent.start.date).toLocaleDateString('es-CO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'No especificada'}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Fecha de Fin:</label>
                      <p className="mb-0">
                        {selectedEvent.end_date || selectedEvent?.end?.date 
                          ? new Date(selectedEvent.end_date || selectedEvent.end.date).toLocaleDateString('es-CO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'No especificada'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Detalles del Proceso</h6>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Veterinario:</label>
                      <p className="mb-0">{selectedEvent.veterinarian || 'No especificado'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Ubicación:</label>
                      <p className="mb-0">{selectedEvent.location || 'No especificada'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Hora de Inicio:</label>
                      <p className="mb-0">
                        {selectedEvent.start_time || (selectedEvent?.start?.dateTime && new Date(selectedEvent.start.dateTime).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })) || 'No especificada'}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Hora de Fin:</label>
                      <p className="mb-0">
                        {selectedEvent.end_time || (selectedEvent?.end?.dateTime && new Date(selectedEvent.end.dateTime).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })) || 'No especificada'}
                      </p>
                    </div>
                    {selectedEvent.suffix && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">Identificador:</label>
                        <p className="mb-0 font-monospace small">{selectedEvent.suffix}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del Cliente */}
                {(selectedEvent.client || selectedEvent.client_name || selectedEvent.clientName) && (
                  <div className="mt-4">
                    <h6 className="text-muted mb-3">Información del Cliente</h6>
                    <div className="card">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <p className="mb-1"><strong>Nombre:</strong> {selectedEvent.client?.full_name || selectedEvent.client_name || selectedEvent.clientName}</p>
                            <p className="mb-1"><strong>Email:</strong> {selectedEvent.client?.email || 'No especificado'}</p>
                            <p className="mb-0"><strong>Teléfono:</strong> {selectedEvent.client?.phone || 'No especificado'}</p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-1"><strong>Documento:</strong> {selectedEvent.client?.number_document || 'No especificado'}</p>
                            <p className="mb-1"><strong>Tipo de Documento:</strong> {selectedEvent.client?.type_document || 'No especificado'}</p>
                            <p className="mb-0"><strong>Especialidad:</strong> {selectedEvent.client?.specialty || 'No especificada'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="mt-4">
                    <h6 className="text-muted mb-3">Descripción</h6>
                    <div className="alert alert-info">
                      {selectedEvent.description}
                    </div>
                  </div>
                )}

                {/* Información de creación */}
                <div className="mt-4">
                  <h6 className="text-muted mb-3">Información del Sistema</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Creado:</strong> {selectedEvent.created_at ? new Date(selectedEvent.created_at).toLocaleString('es-CO') : 'No disponible'}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Actualizado:</strong> {selectedEvent.updated_at ? new Date(selectedEvent.updated_at).toLocaleString('es-CO') : 'No disponible'}</p>
                    </div>
                  </div>
                  {selectedEvent.creator && (
                    <p className="mb-0 mt-2"><strong>Creado por:</strong> {selectedEvent.creator.full_name || selectedEvent.creator.email || 'Usuario del sistema'}</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger me-auto"
                  onClick={async () => {
                    if (!window.confirm('¿Está seguro de eliminar esta tarea?')) return;
                    try {
                      await deleteTask(selectedEvent.id);
                      setShowEventModal(false);
                    } catch (err) {
                      console.error('Error eliminando tarea:', err);
                    }
                  }}
                >
                  <i className="bi bi-trash me-2"></i>
                  Eliminar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEventModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className={`btn btn-${selectedEvent.status === 'completed' ? 'warning' : 'success'}`}
                  onClick={async () => {
                    try {
                      await toggleTaskStatus(selectedEvent.id);
                      // No cerrar el modal para que el usuario vea el cambio
                    } catch (err) {
                      console.error('Error cambiando estado:', err);
                    }
                  }}
                >
                  <i className={`bi bi-${selectedEvent.status === 'completed' ? 'arrow-counterclockwise' : 'check'} me-2`}></i>
                  {selectedEvent.status === 'completed' ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal con todas las tareas del mes */}
      {showAllTasksModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-event me-2"></i>
                  Todas las Tareas de {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  <span className="badge bg-primary ms-2">
                    {monthTasks.length} {monthTasks.length === 1 ? 'tarea' : 'tareas'}
                  </span>
                </h5>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={async () => {
                    // Recargar tareas del mes
                    try {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth() + 1;
                      const monthTasksData = await calendarServices.getTasksByMonth(year, month);
                      const normalized = normalizeTasksArray(monthTasksData);
                      setMonthTasks(normalized);
                      if (!selectedClient) {
                        setFilteredTasks(normalized);
                      }
                    } catch (err) {
                      console.error("Error recargando tareas:", err);
                      setError("Error al recargar las tareas");
                    }
                  }}
                  title="Recargar tareas"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
                <button type="button" className="btn-close" onClick={() => setShowAllTasksModal(false)}></button>
              </div>
              <div className="modal-body">
                {monthTasks.length === 0 ? (
                  <div className="alert alert-info mb-0">No hay tareas para este mes.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tarea</th>
                          <th>Cliente</th>
                          <th>Hora</th>
                          <th>Veterinario</th>
                          <th>Ubicación</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthTasks
                          .sort((a, b) => {
                            const dateA = a.start_date || a.start?.date || '';
                            const dateB = b.start_date || b.start?.date || '';
                            if (dateA !== dateB) return dateA.localeCompare(dateB);
                            const timeA = a.start_time || '';
                            const timeB = b.start_time || '';
                            return timeA.localeCompare(timeB);
                          })
                          .map(task => {
                            const clientName = task.client_name || task.clientName || task.client?.full_name || 'Sin cliente';
                            const taskSummary = task.summary || task.task_name || 'Tarea';
                            const taskDate = task.start_date || task.start?.date || 'Sin fecha';
                            const taskTime = task.start_time || (task.start?.dateTime && new Date(task.start.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })) || 'Sin hora';
                            
                            return (
                              <tr key={task.id}>
                                <td>
                                  {taskDate ? new Date(taskDate).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short'
                                  }) : 'Sin fecha'}
                                </td>
                                <td>
                                  <div className="fw-bold">{taskSummary}</div>
                                  <small className="text-muted">{task.task_type || task.taskType || ''}</small>
                                </td>
                                <td>{clientName}</td>
                                <td>{taskTime}</td>
                                <td>{task.veterinarian || 'No especificado'}</td>
                                <td>{task.location || 'No especificada'}</td>
                                <td>
                                  <span className={`badge bg-${getStatusColor(task.status)}`}>
                                    {getStatusText(task.status)}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <button
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => {
                                        openEventModal(task);
                                        setShowAllTasksModal(false);
                                      }}
                                      title="Ver detalles"
                                    >
                                      <i className="bi bi-eye"></i>
                                    </button>
                                    <button
                                      className={`btn btn-sm ${task.status === 'completed' ? 'btn-warning' : 'btn-success'}`}
                                      onClick={async () => {
                                        try {
                                          await toggleTaskStatus(task.id);
                                        } catch (err) {
                                          console.error('Error cambiando estado:', err);
                                        }
                                      }}
                                      title={task.status === 'completed' ? 'Marcar pendiente' : 'Marcar completada'}
                                    >
                                      <i className={`bi ${task.status === 'completed' ? 'bi-arrow-counterclockwise' : 'bi-check'}`}></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={async () => {
                                        if (!window.confirm('¿Eliminar esta tarea?')) return;
                                        try {
                                          await calendarServices.deleteTask(task.id);
                                          const removeTask = (prev) => prev.filter(x => x.id !== task.id);
                                          
                                          setTasks(removeTask);
                                          setFilteredTasks(removeTask);
                                          setMonthTasks(removeTask);
                                          
                                          // Recargar tareas del mes para asegurar sincronización
                                          const year = currentDate.getFullYear();
                                          const month = currentDate.getMonth() + 1;
                                          const monthTasksData = await calendarServices.getTasksByMonth(year, month);
                                          const normalized = normalizeTasksArray(monthTasksData);
                                          setMonthTasks(normalized);
                                          if (!selectedClient) {
                                            setFilteredTasks(normalized);
                                          }
                                        } catch (err) {
                                          console.error('Error eliminando:', err);
                                          setError('No se pudo eliminar la tarea.');
                                        }
                                      }}
                                      title="Eliminar"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAllTasksModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 