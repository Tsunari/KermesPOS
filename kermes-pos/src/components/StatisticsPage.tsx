import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Autocomplete,
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  Button,
  Stack,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Collapse,
  Menu,
  MenuItem,
  ListSubheader,
  Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Icon imports
import GridViewIcon from '@mui/icons-material/GridView';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EuroIcon from '@mui/icons-material/Euro';
import FoodBankIcon from '@mui/icons-material/FoodBank';
import CoffeeIcon from '@mui/icons-material/Coffee';
import CookieIcon from '@mui/icons-material/Cookie';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import BlockIcon from '@mui/icons-material/Block';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PrintIcon from '@mui/icons-material/Print';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CategoryIcon from '@mui/icons-material/Category';
import FilterListIcon from '@mui/icons-material/FilterList';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import RemoveIcon from '@mui/icons-material/Remove';

// Contexts & services
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useVariableContext } from '../context/VariableContext';
import { Product, CartItem } from '../types/index';
import { Session } from '../types/session';
import { cartTransactionService, ProductStats } from '../services/cartTransactionService';
import { sessionService } from '../services/sessionService';
import { generateSummaryPDF } from '../services/summary';
import { exampleTransactions } from '../services/exampleTransactions';
import { printCart } from '../services/printerService';
import ProductStatsTable from './ProductStatsTable';

interface StatisticsPageProps {
  products: Product[];
  devMode: boolean;
}

interface CartTransaction {
  id: number;
  transaction_date: string;
  total_amount: number;
  items_count: number;
  items_data: string;
  payment_method: string;
  session_id?: string;
}

type TimeRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'allTime' | 'custom';

interface TimeRange {
  startDate: Date;
  endDate: Date;
  preset: TimeRangePreset;
}

interface ExtendedProductStats extends ProductStats {
  contributionPercent: string;
}

const getDateRange = (preset: TimeRangePreset, customStart?: Date, customEnd?: Date): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    
    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday start
      const monday = new Date(today);
      monday.setDate(monday.getDate() + diff);
      return {
        startDate: monday,
        endDate: new Date(now.getTime())
      };
    }
    
    case 'lastWeek': {
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(today);
      thisMonday.setDate(thisMonday.getDate() + diff);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(lastSunday.getDate() - 1);
      lastSunday.setHours(23, 59, 59, 999);
      return {
        startDate: lastMonday,
        endDate: lastSunday
      };
    }
    
    case 'thisMonth': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: firstDay,
        endDate: new Date(now.getTime())
      };
    }
    
    case 'allTime': {
      return {
        startDate: new Date(0),
        endDate: new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000) // far future
      };
    }

    case 'custom':
      return {
        startDate: customStart || today,
        endDate: customEnd || new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    default:
      return {
        startDate: today,
        endDate: new Date(now.getTime())
      };
  }
};

const StatisticsPage: React.FC<StatisticsPageProps> = ({ products, devMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { formatPrice, currency } = useSettings();
  const { kursName, sessions, setSessions } = useVariableContext();

  const auditLogRef = useRef<HTMLDivElement>(null);
  const dayScrollContainerRef = useRef<HTMLDivElement>(null);

  const isDarkMode = theme.palette.mode === 'dark';

  // Core Data States
  const [allTransactions, setAllTransactions] = useState<CartTransaction[]>([]);
  
  // Selected Filter Configs
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kermes_stats_selected_session_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedKermesDay, setSelectedKermesDay] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('kermes_stats_selected_kermes_day');
      return saved !== null ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [timePreset, setTimePreset] = useState<TimeRangePreset>(() => {
    try {
      const saved = localStorage.getItem('kermes_stats_time_preset');
      return (saved as TimeRangePreset) || 'today';
    } catch {
      return 'today';
    }
  });
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

  // Search & Interactivity filters
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Dialog management states
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [sortBy, setSortBy] = useState<'revenue' | 'units'>('revenue');
  const [signersDialogOpen, setSignersDialogOpen] = useState(false);
  const [signers, setSigners] = useState([
    { name: 'Test Isim', surname: 'Test Soyisim' },
    { name: 'Test Isim', surname: 'Test Soyisim' },
  ]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<CartTransaction | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<CartTransaction | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editAddProductId, setEditAddProductId] = useState<number | null>(null);
  const [editAddProductQty, setEditAddProductQty] = useState<number>(1);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Pagination for logs
  const [logPage, setLogPage] = useState<number>(1);
  const itemsPerLogPage = 5;

  // Hourly Graph Hover Tooltip State
  const [hoveredTimelinePoint, setHoveredTimelinePoint] = useState<{
    label: string;
    revenue: number;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Category Donut Hover Tooltip State
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);

  // Load primary data from service
  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      const transactionsData = await cartTransactionService.getTransactions();
      if (devMode) {
        setAllTransactions(exampleTransactions);
      } else {
        setAllTransactions(transactionsData);
      }

      const loadedSessions = await sessionService.getAllSessions();
      const sortedSessions = [...loadedSessions].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.startDate || 0).getTime();
        const bTime = new Date(b.createdAt || b.startDate || 0).getTime();
        return bTime - aTime;
      });
      setSessions(sortedSessions);

      // Clean up selected session IDs that don't exist anymore in the DB
      setSelectedSessionIds(prev => prev.filter(id => sortedSessions.some(s => s.id === id)));
    } catch (error) {
      console.error('Error loading statistics data:', error);
    } finally {
      setLoadingData(false);
    }
  }, [devMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive precise Date Range
  const derivedDateRange = useMemo<TimeRange>(() => {
    if (timePreset === 'custom') {
      const start = new Date(customStartDate + 'T00:00:00');
      const end = new Date(customEndDate + 'T23:59:59');
      return { startDate: start, endDate: end, preset: 'custom' };
    }
    const range = getDateRange(timePreset);
    return { ...range, preset: timePreset };
  }, [timePreset, customStartDate, customEndDate]);

  // Days calculations for selected session
  const kermesDays = useMemo(() => {
    if (selectedSessionIds.length !== 1) return [];
    const session = sessions.find(s => s.id === selectedSessionIds[0]);
    if (!session) return [];

    const start = new Date(session.startDate);
    const end = session.endDate ? new Date(session.endDate) : new Date();

    // Reset times to midnight for date calculations
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const daysList = [];
    const limit = 30; // safety ceiling
    let current = new Date(startDate);
    let count = 1;

    while (current <= endDate && count <= limit) {
      const label = current.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' });
      daysList.push({
        dayNumber: count,
        label: label,
        date: new Date(current)
      });
      current.setDate(current.getDate() + 1);
      count++;
    }
    return daysList;
  }, [selectedSessionIds, sessions]);

  useEffect(() => {
    if (selectedSessionIds.length === 1 && dayScrollContainerRef.current) {
      const container = dayScrollContainerRef.current;
      const timer = setTimeout(() => {
        const activeEl = container.querySelector('.Mui-selected');
        if (activeEl) {
          activeEl.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedKermesDay, selectedSessionIds, kermesDays]);

  // Sync selection state to LocalStorage for persistence
  useEffect(() => {
    localStorage.setItem('kermes_stats_selected_session_ids', JSON.stringify(selectedSessionIds));
  }, [selectedSessionIds]);

  useEffect(() => {
    localStorage.setItem('kermes_stats_selected_kermes_day', JSON.stringify(selectedKermesDay));
  }, [selectedKermesDay]);

  useEffect(() => {
    localStorage.setItem('kermes_stats_time_preset', timePreset);
  }, [timePreset]);

  // Unified Reactive Filter Logic for Transactions
  const filteredTransactions = useMemo(() => {
    let txs = allTransactions;

    // 1. Session Filter (If selected, this bounds the transactions)
    if (selectedSessionIds.length > 0) {
      txs = txs.filter(tx => {
        if (tx.session_id) {
          return selectedSessionIds.includes(tx.session_id);
        }
        // Fallback to session date bounds if transaction lacks session ID
        const txTime = new Date(tx.transaction_date).getTime();
        return selectedSessionIds.some(sid => {
          const s = sessions.find(sess => sess.id === sid);
          if (!s) return false;
          const sStart = new Date(s.startDate).getTime();
          const sEnd = s.endDate ? new Date(s.endDate).getTime() : Date.now() + 1000 * 60 * 60;
          return txTime >= sStart && txTime <= sEnd;
        });
      });

      // 2. If exactly one session is selected, filter by the selected day
      if (selectedSessionIds.length === 1 && selectedKermesDay !== null) {
        const targetDay = kermesDays.find(d => d.dayNumber === selectedKermesDay);
        if (targetDay) {
          const targetDateStr = targetDay.date.toDateString();
          txs = txs.filter(tx => new Date(tx.transaction_date).toDateString() === targetDateStr);
        }
      }
    } else {
      // 3. Date Range Filter (Only applies if no explicit sessions are selected to prevent filtering conflicts)
      const startMs = derivedDateRange.startDate.getTime();
      const endMs = derivedDateRange.endDate.getTime();
      txs = txs.filter(tx => {
        const txTime = new Date(tx.transaction_date).getTime();
        return txTime >= startMs && txTime <= endMs;
      });
    }

    return txs;
  }, [allTransactions, selectedSessionIds, selectedKermesDay, kermesDays, derivedDateRange, sessions]);

  // Compute stats on active transactions list
  const activeMetrics = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.total_amount, 0);
    const totalTransactions = filteredTransactions.length;
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalUnits = filteredTransactions.reduce((sum, tx) => sum + tx.items_count, 0);

    return { totalRevenue, totalTransactions, avgOrderValue, totalUnits };
  }, [filteredTransactions]);

  // Prior Transactions and Comparison Context useMemo
  const priorTransactionsData = useMemo(() => {
    // 1. Multiple sessions: comparisons disabled
    if (selectedSessionIds.length > 1) {
      return {
        transactions: [],
        isValid: false,
        label: '',
        dateRangeText: '',
        noCompareReason: `${t('app.statistics.cumulative') || 'Cumulative across'} ${selectedSessionIds.length} ${t('app.statistics.sessions') || 'sessions'}`
      };
    }

    // 2. Exactly one session selected
    if (selectedSessionIds.length === 1) {
      const firstSelectedIdx = sessions.findIndex(s => s.id === selectedSessionIds[0]);
      const currentSession = firstSelectedIdx !== -1 ? sessions[firstSelectedIdx] : null;
      const priorSession = firstSelectedIdx !== -1 && firstSelectedIdx + 1 < sessions.length 
        ? sessions[firstSelectedIdx + 1] 
        : null;

      // Helper to get prior session transactions
      const getSessionTransactions = (sessionObj: any) => {
        return allTransactions.filter(tx => {
          if (tx.session_id) return tx.session_id === sessionObj.id;
          const txTime = new Date(tx.transaction_date).getTime();
          const sStart = new Date(sessionObj.startDate).getTime();
          const sEnd = sessionObj.endDate ? new Date(sessionObj.endDate).getTime() : Date.now();
          return txTime >= sStart && txTime <= sEnd;
        });
      };

      if (selectedKermesDay === null) {
        // Compare entire session with entire prior session
        if (!priorSession) {
          return {
            transactions: [],
            isValid: false,
            label: '',
            dateRangeText: '',
            noCompareReason: t('app.statistics.noPriorSession') || 'No prior kermes event to compare'
          };
        }
        const txs = getSessionTransactions(priorSession);
        return {
          transactions: txs,
          isValid: true,
          label: t('app.statistics.vsPriorSession') || 'vs. prior event',
          dateRangeText: priorSession.name || priorSession.id,
          noCompareReason: ''
        };
      }

      // If specific Day X is selected
      if (selectedKermesDay > 1) {
        // Compare Day X with Day X-1 of the same session
        const prevDayObj = kermesDays.find(d => d.dayNumber === selectedKermesDay - 1);
        if (!prevDayObj) {
          return {
            transactions: [],
            isValid: false,
            label: '',
            dateRangeText: '',
            noCompareReason: 'No prior day'
          };
        }
        const prevDayDateStr = prevDayObj.date.toDateString();
        const currentSessionTxs = currentSession ? getSessionTransactions(currentSession) : [];
        const txs = currentSessionTxs.filter(tx => new Date(tx.transaction_date).toDateString() === prevDayDateStr);

        return {
          transactions: txs,
          isValid: true,
          label: `vs. Day ${selectedKermesDay - 1}`,
          dateRangeText: prevDayObj.label,
          noCompareReason: ''
        };
      }

      // If Day 1 is selected: compare with Day 1 of prior session
      if (selectedKermesDay === 1) {
        if (!priorSession) {
          return {
            transactions: [],
            isValid: false,
            label: '',
            dateRangeText: '',
            noCompareReason: t('app.statistics.noPriorSessionDay1') || 'No prior Day 1'
          };
        }
        // Day 1 of prior session is the startDate of prior session
        const priorDay1DateStr = new Date(priorSession.startDate).toDateString();
        const priorSessionTxs = getSessionTransactions(priorSession);
        const txs = priorSessionTxs.filter(tx => new Date(tx.transaction_date).toDateString() === priorDay1DateStr);

        const priorDay1DateFormatted = new Date(priorSession.startDate).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' });

        return {
          transactions: txs,
          isValid: true,
          label: t('app.statistics.vsPriorDay1') || 'vs. Day 1 of prior event',
          dateRangeText: `${priorSession.name || priorSession.id} (${priorDay1DateFormatted})`,
          noCompareReason: ''
        };
      }
    }

    // 3. No sessions selected (Calendar presets mode)
    let priorStart: Date;
    let priorEnd: Date;
    let label = 'vs. prior period';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timePreset === 'today') {
      // Compare with Yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      priorStart = yesterday;
      priorEnd = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1);
      label = t('app.statistics.vsYesterday') || 'vs. yesterday';
    } else if (timePreset === 'thisWeek') {
      // Compare with Last Week (entire week: Monday to Sunday)
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(today);
      thisMonday.setDate(thisMonday.getDate() + diffToMonday);
      
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(lastSunday.getDate() - 1);
      lastSunday.setHours(23, 59, 59, 999);
      
      priorStart = lastMonday;
      priorEnd = lastSunday;
      label = t('app.statistics.vsPriorWeek') || 'vs. prior week';
    } else if (timePreset === 'thisMonth') {
      // Compare with Last Month (entire month: 1st of last month to last of last month)
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // day 0 is last day of prev month
      lastDayOfLastMonth.setHours(23, 59, 59, 999);
      
      priorStart = firstDayOfLastMonth;
      priorEnd = lastDayOfLastMonth;
      label = t('app.statistics.vsPriorMonth') || 'vs. prior month';
    } else {
      // allTime and custom (no comparison)
      return {
        transactions: [],
        isValid: false,
        label: '',
        dateRangeText: '',
        noCompareReason: timePreset === 'allTime' 
          ? t('app.statistics.noCompareAllTime') || 'No comparison for all time'
          : t('app.statistics.noCompareCustom') || 'No comparison for custom range'
      };
    }

    const txs = allTransactions.filter(tx => {
      const txTime = new Date(tx.transaction_date).getTime();
      return txTime >= priorStart.getTime() && txTime <= priorEnd.getTime();
    });

    const rangeStartFormatted = priorStart.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
    const rangeEndFormatted = priorEnd.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
    const dateRangeText = timePreset === 'today'
      ? rangeStartFormatted
      : `${rangeStartFormatted} - ${rangeEndFormatted}`;

    return {
      transactions: txs,
      isValid: true,
      label,
      dateRangeText,
      noCompareReason: ''
    };
  }, [allTransactions, selectedSessionIds, selectedKermesDay, kermesDays, timePreset, derivedDateRange, sessions, t]);

  // Trend calculations based on prior transactions data
  const trendMetrics = useMemo(() => {
    const { transactions: priorTxs, isValid, label, dateRangeText, noCompareReason } = priorTransactionsData;

    if (!isValid) {
      return {
        isValid: false,
        revenuePercent: '0.0',
        transactionsPercent: '0.0',
        compareText: '',
        priorValueText: '',
        priorTransactionsText: '',
        noCompareReason
      };
    }

    const priorRev = priorTxs.reduce((sum, tx) => sum + tx.total_amount, 0);
    const priorCount = priorTxs.length;

    const revDiff = priorRev > 0 ? ((activeMetrics.totalRevenue - priorRev) / priorRev) * 100 : 0;
    const countDiff = priorCount > 0 ? ((activeMetrics.totalTransactions - priorCount) / priorCount) * 100 : 0;

    // e.g. "vs. yesterday (02.06.): €1,240.00"
    const priorValueText = `${label} (${dateRangeText}): ${formatPrice(priorRev)}`;
    // e.g. "vs. yesterday (02.06.): 25 Orders"
    const priorTransactionsText = `${label} (${dateRangeText}): ${priorCount.toLocaleString()} ${t('app.statistics.ordersCount') || 'Orders'}`;

    return {
      isValid: true,
      revenuePercent: revDiff.toFixed(1),
      transactionsPercent: countDiff.toFixed(1),
      compareText: `${label} (${dateRangeText})`,
      priorValueText,
      priorTransactionsText,
      noCompareReason: ''
    };
  }, [priorTransactionsData, activeMetrics, formatPrice, t]);

  // Timeline Graph Grouping Data Engine
  const timelineData = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return [];
    }

    let minTime = Math.min(...filteredTransactions.map(tx => new Date(tx.transaction_date).getTime()));
    let maxTime = Math.max(...filteredTransactions.map(tx => new Date(tx.transaction_date).getTime()));

    if (maxTime - minTime <= 36 * 60 * 60 * 1000) {
      const minHourDate = new Date(minTime);
      minHourDate.setMinutes(0, 0, 0);
      const startHour = Math.max(0, minHourDate.getHours() - 1);
      
      const maxHourDate = new Date(maxTime);
      maxHourDate.setMinutes(59, 59, 999);
      const endHour = Math.min(23, maxHourDate.getHours() + 1);

      const hoursList: { label: string; hour: number; revenue: number; count: number }[] = [];
      for (let h = startHour; h <= endHour; h++) {
        hoursList.push({
          label: `${String(h).padStart(2, '0')}:00`,
          hour: h,
          revenue: 0,
          count: 0
        });
      }

      filteredTransactions.forEach(tx => {
        const hour = new Date(tx.transaction_date).getHours();
        const bucket = hoursList.find(b => b.hour === hour);
        if (bucket) {
          bucket.revenue += tx.total_amount;
          bucket.count += tx.items_count;
        }
      });

      return hoursList;
    } else {
      const dailyMap = new Map<string, { revenue: number; count: number }>();
      
      filteredTransactions.forEach(tx => {
        const dStr = new Date(tx.transaction_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const existing = dailyMap.get(dStr) || { revenue: 0, count: 0 };
        existing.revenue += tx.total_amount;
        existing.count += tx.items_count;
        dailyMap.set(dStr, existing);
      });

      return Array.from(dailyMap.entries())
        .map(([label, val]) => ({
          label,
          revenue: val.revenue,
          count: val.count
        }))
        .slice(-10); // Display last 10 days for clarity
    }
  }, [filteredTransactions]);

  // Category Breakdown calculations
  const categoryBreakdown = useMemo(() => {
    const counts = { food: 0, drink: 0, dessert: 0, other: 0 };
    const revenues = { food: 0, drink: 0, dessert: 0, other: 0 };

    filteredTransactions.forEach(tx => {
      try {
        const items = JSON.parse(tx.items_data) as CartItem[];
        items.forEach(item => {
          const category = (item.product?.category || 'other').toLowerCase() as keyof typeof counts;
          const price = item.product?.price || 0;
          const qty = item.quantity || 0;

          if (counts[category] !== undefined) {
            counts[category] += qty;
            revenues[category] += qty * price;
          } else {
            counts.other += qty;
            revenues.other += qty * price;
          }
        });
      } catch (e) {
        console.error('Error calculating category breakdown', e);
      }
    });

    const totalRev = Object.values(revenues).reduce((a, b) => a + b, 0);

    return [
      { name: 'food', label: t('app.categories.food') || 'Food', value: revenues.food, count: counts.food, color: '#8F9BFF' },
      { name: 'drink', label: t('app.categories.drink') || 'Drink', value: revenues.drink, count: counts.drink, color: '#4CC3FF' },
      { name: 'dessert', label: t('app.categories.dessert') || 'Dessert', value: revenues.dessert, count: counts.dessert, color: '#F098FF' },
      { name: 'other', label: t('app.statistics.unknownProduct') || 'Other', value: revenues.other, count: counts.other, color: '#90A4AE' }
    ].map(cat => ({
      ...cat,
      percent: totalRev > 0 ? ((cat.value / totalRev) * 100).toFixed(0) : '0'
    }));
  }, [filteredTransactions, t]);

  // Item Analytics Leaderboard and Dialog full list
  const itemLeaderboard = useMemo<ExtendedProductStats[]>(() => {
    const statsMap = new Map<string, { product: Product; count: number; revenue: number; priceHistory?: any[] }>();

    filteredTransactions.forEach(tx => {
      try {
        const items = JSON.parse(tx.items_data) as CartItem[];
        items.forEach(item => {
          if (!item?.product?.id) return;
          const prod = products.find(p => p.id === item.product.id) || item.product;
          const price = item.product.price || prod.price || 0;
          const revenue = item.quantity * price;

          const existing = statsMap.get(prod.id);
          if (existing) {
            existing.count += item.quantity;
            existing.revenue += revenue;

            if (!existing.priceHistory) {
              existing.priceHistory = [];
            }
            const existingPrice = existing.priceHistory.find(p => p.price === price);
            if (existingPrice) {
              existingPrice.quantity += item.quantity;
            } else {
              existing.priceHistory.push({ price, quantity: item.quantity });
            }
          } else {
            statsMap.set(prod.id, {
              product: prod,
              count: item.quantity,
              revenue: revenue,
              priceHistory: [{ price, quantity: item.quantity }]
            });
          }
        });
      } catch (e) {
        console.error('Leaderboard calculation parsing error', e);
      }
    });

    const totalRev = Array.from(statsMap.values()).reduce((sum, item) => sum + item.revenue, 0);

    return Array.from(statsMap.values())
      .map(item => ({
        product: item.product,
        count: item.count,
        revenue: item.revenue,
        priceHistory: item.priceHistory,
        contributionPercent: totalRev > 0 ? ((item.revenue / totalRev) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => sortBy === 'revenue' ? b.revenue - a.revenue : b.count - a.count);
  }, [filteredTransactions, products, sortBy]);

  // Previous Period Stats specifically calculated for Table comparisons
  const previousPeriodStats = useMemo(() => {
    const priorTxs = priorTransactionsData.transactions;

    const statsMap = new Map<string, { product: Product; count: number; revenue: number }>();
    priorTxs.forEach(tx => {
      try {
        const items = JSON.parse(tx.items_data) as CartItem[];
        items.forEach(item => {
          if (!item?.product?.id) return;
          const prod = products.find(p => p.id === item.product.id) || item.product;
          const price = item.product.price || prod.price || 0;
          const revenue = item.quantity * price;

          const existing = statsMap.get(prod.id);
          if (existing) {
            existing.count += item.quantity;
            existing.revenue += revenue;
          } else {
            statsMap.set(prod.id, {
              product: prod,
              count: item.quantity,
              revenue: revenue
            });
          }
        });
      } catch (e) {}
    });

    return Array.from(statsMap.values()).map(item => ({
      product: item.product,
      count: item.count,
      revenue: item.revenue
    }));
  }, [priorTransactionsData, products]);

  // Live Audited & Filtered Logs (Bottom Section)
  const auditedTransactions = useMemo(() => {
    let txs = filteredTransactions;

    // Apply Live Text Search (Transaction ID, Product name)
    if (logSearchQuery.trim() !== '') {
      const query = logSearchQuery.toLowerCase();
      txs = txs.filter(tx => {
        const matchesId = String(tx.id).includes(query);
        const matchesMethod = tx.payment_method.toLowerCase().includes(query);
        let matchesProduct = false;
        try {
          const items = JSON.parse(tx.items_data);
          matchesProduct = items.some((item: any) => 
            (item.product?.name || '').toLowerCase().includes(query)
          );
        } catch (e) {}

        return matchesId || matchesMethod || matchesProduct;
      });
    }

    // Apply Category segments filter
    if (activeCategoryFilter) {
      txs = txs.filter(tx => {
        try {
          const items = JSON.parse(tx.items_data);
          return items.some((item: any) => 
            (item.product?.category || '').toLowerCase() === activeCategoryFilter.toLowerCase()
          );
        } catch (e) {
          return false;
        }
      });
    }

    // Sort by Date descending (newest first)
    return [...txs].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [filteredTransactions, logSearchQuery, activeCategoryFilter]);

  // Pagination calculations for log auditing
  const paginatedLogs = useMemo(() => {
    const startIdx = (logPage - 1) * itemsPerLogPage;
    return auditedTransactions.slice(startIdx, startIdx + itemsPerLogPage);
  }, [auditedTransactions, logPage]);

  const totalLogPages = Math.ceil(auditedTransactions.length / itemsPerLogPage);

  // Reprint Receipt Dispatch spooler
  const handleReprintReceipt = async (tx: CartTransaction) => {
    try {
      let items: CartItem[] = [];
      try {
        items = JSON.parse(tx.items_data);
      } catch (e) {
        console.error('Failed to parse items for reprint', e);
        return;
      }

      const success = await printCart(items, tx.total_amount);
      if (success) {
        alert(t('app.cart.printSuccess') || 'Receipt spooled successfully!');
      } else {
        alert(t('app.cart.printFailed') || 'Failed to print receipt.');
      }
    } catch (error) {
      console.error('Error in handleReprintReceipt', error);
    }
  };

  // CSV Report exporter
  const handleExportProductAnalytics = () => {
    if (!filteredTransactions.length) {
      alert('No statistics recorded to download');
      return;
    }

    const header = ['Transaction Date', 'Order ID', 'Total Amount', 'Items Count', 'Payment Method'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.transaction_date).toLocaleString(),
      tx.id,
      tx.total_amount.toFixed(2),
      tx.items_count,
      tx.payment_method
    ]);

    const csvContent = [header, ...rows]
      .map(row => row.map(String).map(val => `"${val}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clean confirm database clear trigger
  const handleClearDatabase = async () => {
    await cartTransactionService.clearAllTransactions();
  };

  // Responsive SVG line coordinates mapper
  const svgTimelineContent = useMemo(() => {
    if (timelineData.length < 2) return null;

    const width = 600;
    const height = 220;
    const margin = { top: 20, right: 30, bottom: 40, left: 55 };

    const revenues = timelineData.map(d => d.revenue);
    const maxVal = Math.max(...revenues, 10);
    const minVal = 0;
    const range = maxVal - minVal;

    const points = timelineData.map((d, index) => {
      const x = margin.left + (index / (timelineData.length - 1)) * (width - margin.left - margin.right);
      const y = margin.top + (1 - (d.revenue - minVal) / range) * (height - margin.top - margin.bottom);
      return { x, y, label: d.label, revenue: d.revenue, count: d.count };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - margin.bottom} L ${points[0].x} ${height - margin.bottom} Z`;

    return { width, height, margin, points, pathD, areaD, maxVal };
  }, [timelineData]);

  // Clean confirm database clear trigger
  const donutCenterText = useMemo(() => {
    if (hoveredCategoryIndex !== null) {
      const hovered = categoryBreakdown[hoveredCategoryIndex];
      return {
        subtitle: hovered.label,
        value: `${hovered.percent}%`,
        subText: formatPrice(hovered.value)
      };
    }

    return {
      subtitle: t('app.statistics.totalRevenue') || 'Total Sales',
      value: formatPrice(activeMetrics.totalRevenue),
      subText: `${activeMetrics.totalTransactions} ${t('sales.title') || 'Orders'}`
    };
  }, [activeMetrics, categoryBreakdown, hoveredCategoryIndex, formatPrice, t]);

  // Donut Slices Center typography font scale sizing
  const valueFontSize = useMemo(() => {
    const len = donutCenterText.value.length;
    if (len > 12) return '1.05rem';
    if (len > 8) return '1.22rem';
    return '1.45rem';
  }, [donutCenterText.value]);

  // Dynamic Graph Tooltip Transform positioning to ensure it stays in visible borders
  const tooltipTransform = useMemo(() => {
    if (!hoveredTimelinePoint) return 'translate(-50%, -105%)';
    const { x, y } = hoveredTimelinePoint;
    
    let translateX = '-50%';
    let translateY = '-105%';

    // Proximity to left edge
    if (x < 120) {
      translateX = '0%';
    } 
    // Proximity to right edge
    else if (x > 480) {
      translateX = '-100%';
    }

    // Proximity to top edge (flip tooltip downward)
    if (y < 60) {
      translateY = '15%';
    }

    return `translate(${translateX}, ${translateY})`;
  }, [hoveredTimelinePoint]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', color: 'text.primary', pb: 12, borderRadius: 3 }}>
      
      {/* Dev mode warning banner */}
      {devMode && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 1.5, 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            bgcolor: 'warning.light', 
            color: 'warning.dark',
            border: '1.5px solid',
            borderColor: 'warning.main',
            borderRadius: 2
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            ⚠️ {t('app.devMode.enableToUse') || 'Example mock statistics are active (DEV MODE)'}
          </Typography>
        </Paper>
      )}

      {/* STICKY HORIZONTAL CONTROL BAR */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'background.paper',
          border: '1.5px solid',
          borderColor: 'divider',
          borderRadius: 3,
          boxShadow: isDarkMode ? '0 8px 30px 0 rgba(0,0,0,0.3)' : '0 8px 30px 0 rgba(0,0,0,0.03)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Title block */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AssessmentIcon color="primary" />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {t('app.statistics.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('app.statistics.description')}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid 
            size={{ xs: 12, sm: 6, md: 4 }}
            sx={{ ml: selectedSessionIds.length === 1 ? { md: 'auto' } : 0 }}
          >
            <Autocomplete
              multiple
              options={sessions}
              getOptionLabel={(option) => option.name || option.id}
              size="small"
              value={sessions.filter(session => selectedSessionIds.includes(session.id))}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => {
                setSelectedSessionIds(value.map(session => session.id));
                setSelectedKermesDay(null);
                setLogPage(1); // reset page
              }}
              filterSelectedOptions
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  transition: 'all 0.2s',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                  },
                  '&.Mui-focused': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }
                }
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name || option.id}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 24,
                      fontSize: '0.75rem',
                      borderRadius: 2,
                      borderColor: 'primary.light',
                      color: 'primary.main',
                      fontWeight: 600,
                      bgcolor: isDarkMode ? 'rgba(143,155,255,0.08)' : 'rgba(143,155,255,0.04)',
                      '& .MuiChip-deleteIcon': {
                        fontSize: '14px',
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('app.statistics.sessionFilter') || 'Filter by sessions'}
                  placeholder={
                    selectedSessionIds.length
                      ? undefined
                      : t('app.statistics.allSessions') || 'Cumulative All Sessions'
                  }
                  InputLabelProps={{
                    sx: { fontSize: '0.85rem' }
                  }}
                />
              )}
              noOptionsText={t('app.statistics.noSessions') || 'No sessions available'}
            />
          </Grid>

          {/* Date range filter segmented control */}
          {selectedSessionIds.length !== 1 && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {selectedSessionIds.length === 0 ? (
                  <ToggleButtonGroup
                    value={timePreset}
                    exclusive
                    onChange={(_, newVal) => {
                      if (!newVal) return;
                      setTimePreset(newVal);
                      if (newVal === 'custom') {
                        setShowCustomDatePicker(true);
                      } else {
                        setShowCustomDatePicker(false);
                      }
                      setLogPage(1); // reset log index
                    }}
                    size="small"
                    sx={{
                      border: '1.5px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      '& .MuiToggleButtonGroup-grouped': {
                        border: 0,
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.75,
                        fontWeight: 600,
                        borderRadius: 1.5,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }
                      }
                    }}
                  >
                    <ToggleButton value="today">{t('app.statistics.today') || 'Today'}</ToggleButton>
                    <ToggleButton value="thisWeek">{t('app.statistics.thisWeek') || 'Week'}</ToggleButton>
                    <ToggleButton value="thisMonth">{t('app.statistics.thisMonth') || 'Month'}</ToggleButton>
                    <ToggleButton value="allTime">{t('app.statistics.allTime') || 'All Time'}</ToggleButton>
                    <ToggleButton value="custom">
                      <CalendarTodayIcon sx={{ fontSize: '1rem' }} />
                    </ToggleButton>
                  </ToggleButtonGroup>
                ) : (
                  <Chip 
                    icon={<FilterListIcon />}
                    label={t('app.statistics.cumulativeSelected') || 'Cumulative Selected Sessions'}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                )}
              </Stack>
            </Grid>
          )}

          {/* Single Session Day Picker (placed full-width in a new row) */}
          {selectedSessionIds.length === 1 && (
            <Grid size={12} sx={{ mt: 1 }}>
              <Divider sx={{ mb: 2 }} />
              <Box 
                ref={dayScrollContainerRef}
                sx={{ 
                  display: 'flex', 
                  overflowX: 'auto', 
                  maxWidth: '100%', 
                  WebkitOverflowScrolling: 'touch',
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  py: 0.5 
                }}
              >
                <ToggleButtonGroup
                  value={selectedKermesDay === null ? 'all' : selectedKermesDay}
                  exclusive
                  onChange={(_, newVal) => {
                    if (newVal === null) return;
                    setSelectedKermesDay(newVal === 'all' ? null : Number(newVal));
                    setLogPage(1);
                  }}
                  size="small"
                  sx={{
                    mx: 'auto',
                    flexWrap: 'nowrap',
                    border: '1.5px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '& .MuiToggleButtonGroup-grouped': {
                      border: 0,
                      textTransform: 'none',
                      px: 2,
                      py: 0.75,
                      fontWeight: 600,
                      borderRadius: 1.5,
                      whiteSpace: 'nowrap',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }
                    }
                  }}
                >
                  <ToggleButton value="all">{t('app.statistics.allDays') || 'All Days'}</ToggleButton>
                  {kermesDays.map(d => (
                    <ToggleButton key={d.dayNumber} value={d.dayNumber}>
                      {t('app.statistics.dayShort') || 'Day'} {d.dayNumber} ({d.label})
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Custom date range collapsible panel */}
        <Collapse in={showCustomDatePicker && selectedSessionIds.length === 0}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {t('app.statistics.customRange') || 'Custom Period'}:
            </Typography>
            <TextField
              type="date"
              size="small"
              label={t('app.statistics.from') || 'Start Date'}
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setLogPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              type="date"
              size="small"
              label={t('app.statistics.to') || 'End Date'}
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setLogPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <IconButton size="small" onClick={() => setShowCustomDatePicker(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Collapse>
      </Paper>

      {/* Session Onboarding Guide */}
      {(!sessions || sessions.length === 0) && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: '1.5px dashed',
            borderColor: 'primary.main',
            bgcolor: isDarkMode ? 'rgba(143,155,255,0.03)' : 'rgba(143,155,255,0.01)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: 'primary.light',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 0.5
              }}
            >
              <LightbulbOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                {t('app.statistics.sessionGuideTitle') || 'Unlock Kermes Event Tracking'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, lineHeight: 1.6 }}>
                {t('app.statistics.sessionGuideDesc') || 
                  'Create a session on the Sessions page to group your sales by event, enable shift comparisons, and generate printable PDF summaries.'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/sessions')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1.2,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px 0 rgba(143,155,255,0.4)',
            }}
          >
            {t('app.statistics.goToSessions') || 'Go to Sessions'}
          </Button>
        </Paper>
      )}

      {/* KPI METRICS OVERVIEW GRID */}
      <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
        
        {/* KPI 1: Total Revenue */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3, 
              border: '1.5px solid', 
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: 'primary.main',
                boxShadow: isDarkMode ? '0 6px 20px 0 rgba(143,155,255,0.1)' : '0 6px 20px 0 rgba(0,0,0,0.03)'
              }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('app.statistics.totalRevenue') || 'Total Revenue'}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1, letterSpacing: '-1px' }}>
                {formatPrice(activeMetrics.totalRevenue)}
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 1.5, minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {trendMetrics && trendMetrics.isValid ? (
                  <Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {Number(trendMetrics.revenuePercent) >= 0 ? (
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1.1rem' }} />
                      )}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700, 
                          color: Number(trendMetrics.revenuePercent) >= 0 ? 'success.main' : 'error.main' 
                        }}
                      >
                        {Number(trendMetrics.revenuePercent) >= 0 ? '+' : ''}{trendMetrics.revenuePercent}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2 }}>
                      {trendMetrics.priorValueText}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {trendMetrics?.noCompareReason || (t('app.statistics.noComparison') || 'No comparison available')}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Transaction Count */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3, 
              border: '1.5px solid', 
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: 'primary.main',
                boxShadow: isDarkMode ? '0 6px 20px 0 rgba(143,155,255,0.1)' : '0 6px 20px 0 rgba(0,0,0,0.03)'
              }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('app.statistics.transactions') || 'Orders Processed'}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1, letterSpacing: '-1px' }}>
                {activeMetrics.totalTransactions.toLocaleString()}
              </Typography>

              <Box sx={{ mt: 'auto', pt: 1.5, minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {trendMetrics && trendMetrics.isValid ? (
                  <Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {Number(trendMetrics.transactionsPercent) >= 0 ? (
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1.1rem' }} />
                      )}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700, 
                          color: Number(trendMetrics.transactionsPercent) >= 0 ? 'success.main' : 'error.main' 
                        }}
                      >
                        {Number(trendMetrics.transactionsPercent) >= 0 ? '+' : ''}{trendMetrics.transactionsPercent}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2 }}>
                      {trendMetrics.priorTransactionsText}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {trendMetrics?.noCompareReason || (t('app.statistics.noComparison') || 'No comparison available')}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Average Order Value */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3, 
              border: '1.5px solid', 
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: 'primary.main',
                boxShadow: isDarkMode ? '0 6px 20px 0 rgba(143,155,255,0.1)' : '0 6px 20px 0 rgba(0,0,0,0.03)'
              }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('app.statistics.averageOrder') || 'Average Order Value'}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1, letterSpacing: '-1px' }}>
                {formatPrice(activeMetrics.avgOrderValue)}
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 1.5, minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <EuroIcon sx={{ color: 'text.disabled', fontSize: '1.1rem' }} />
                  <Typography variant="caption" color="text.secondary">
                    {t('app.statistics.average') || 'Per receipt basket size'}
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Total Units Sold */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3, 
              border: '1.5px solid', 
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: 'primary.main',
                boxShadow: isDarkMode ? '0 6px 20px 0 rgba(143,155,255,0.1)' : '0 6px 20px 0 rgba(0,0,0,0.03)'
              }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('app.statistics.itemsSold') || 'Units Sold'}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1, letterSpacing: '-1px' }}>
                {activeMetrics.totalUnits.toLocaleString()}
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 1.5, minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CategoryIcon sx={{ color: 'text.disabled', fontSize: '1.1rem' }} />
                  <Typography variant="caption" color="text.secondary">
                    {t('app.statistics.units') || 'Individual items logged'}
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ANALYTICAL VISUALIZATIONS ROW */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Timeline Graph */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              border: '1.5px solid', 
              borderColor: 'divider', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="action" />
                {t('app.statistics.salesVolumeTimeline') || 'Sales Performance Timeline'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedSessionIds.length > 0 ? 'Selected Session Duration' : 'Filtered Period Curve'}
              </Typography>
            </Stack>

            {svgTimelineContent ? (
              <Box sx={{ width: '100%', overflowX: 'auto', flexGrow: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                <svg 
                  viewBox={`0 0 ${svgTimelineContent.width} ${svgTimelineContent.height}`} 
                  width="100%" 
                  height={220}
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="timeline-area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8F9BFF" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8F9BFF" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = svgTimelineContent.margin.top + ratio * (svgTimelineContent.height - svgTimelineContent.margin.top - svgTimelineContent.margin.bottom);
                    const gridVal = svgTimelineContent.maxVal - ratio * svgTimelineContent.maxVal;
                    return (
                      <g key={i}>
                        <line 
                          x1={svgTimelineContent.margin.left} 
                          y1={y} 
                          x2={svgTimelineContent.width - svgTimelineContent.margin.right} 
                          y2={y} 
                          stroke="rgba(128,128,128,0.08)" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={svgTimelineContent.margin.left - 10} 
                          y={y + 4} 
                          fill="gray" 
                          fontSize="9" 
                          textAnchor="end"
                          fontWeight={500}
                        >
                          {formatPrice(gridVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Semi-transparent Area Gradient filled graph */}
                  <path 
                    d={svgTimelineContent.areaD} 
                    fill="url(#timeline-area-gradient)" 
                  />

                  {/* Precise Curved Graph line on top */}
                  <path 
                    d={svgTimelineContent.pathD} 
                    fill="none" 
                    stroke="#8F9BFF" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive circular markers & interactive grid hitboxes */}
                  {svgTimelineContent.points.map((pt, idx) => (
                    <g key={idx}>
                      {/* Vertical line indicator */}
                      {hoveredTimelinePoint?.label === pt.label && (
                        <line 
                          x1={pt.x} 
                          y1={svgTimelineContent.margin.top} 
                          x2={pt.x} 
                          y2={svgTimelineContent.height - svgTimelineContent.margin.bottom} 
                          stroke="rgba(143,155,255,0.4)" 
                          strokeWidth="1" 
                          strokeDasharray="2 2"
                        />
                      )}
                      
                      {/* Point dot marker */}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={hoveredTimelinePoint?.label === pt.label ? 6 : 4} 
                        fill={hoveredTimelinePoint?.label === pt.label ? '#8F9BFF' : (isDarkMode ? '#1e1e24' : '#fff')} 
                        stroke="#8F9BFF" 
                        strokeWidth={hoveredTimelinePoint?.label === pt.label ? 3 : 2}
                        style={{ transition: 'all 0.15s ease' }}
                      />

                      {/* Giant invisible hover capture hitbox */}
                      <rect
                        x={pt.x - 15}
                        y={svgTimelineContent.margin.top}
                        width={30}
                        height={svgTimelineContent.height - svgTimelineContent.margin.top - svgTimelineContent.margin.bottom}
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          setHoveredTimelinePoint({
                            label: pt.label,
                            revenue: pt.revenue,
                            count: pt.count,
                            x: pt.x,
                            y: pt.y - 10
                          });
                        }}
                        onMouseLeave={() => setHoveredTimelinePoint(null)}
                      />
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  {svgTimelineContent.points.map((pt, idx) => {
                    const showLabel = svgTimelineContent.points.length <= 10 || idx % Math.ceil(svgTimelineContent.points.length / 8) === 0;
                    if (!showLabel) return null;
                    return (
                      <text 
                        key={idx}
                        x={pt.x} 
                        y={svgTimelineContent.height - svgTimelineContent.margin.bottom + 20} 
                        fill="gray" 
                        fontSize="9.5" 
                        textAnchor="middle"
                        fontWeight={600}
                      >
                        {pt.label}
                      </text>
                    );
                  })}
                </svg>

                {/* Floating Boundary-Safe Tooltip Div */}
                {hoveredTimelinePoint && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${(hoveredTimelinePoint.x / 600) * 100}%`,
                      top: `${(hoveredTimelinePoint.y / 220) * 100}%`,
                      transform: tooltipTransform,
                      pointerEvents: 'none',
                      zIndex: 10,
                      bgcolor: 'background.paper',
                      border: '1.5px solid',
                      borderColor: 'primary.light',
                      p: 1.5,
                      borderRadius: 2,
                      boxShadow: 4,
                      minWidth: 120,
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                      {hoveredTimelinePoint.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                      {formatPrice(hoveredTimelinePoint.revenue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {hoveredTimelinePoint.count} {t('app.statistics.items') || 'units sold'}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 4 }}>
                <AssessmentIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.4, mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('app.statistics.noData') || 'No timeline data for the selected period'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Category Breakdown Donut */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              border: '1.5px solid', 
              borderColor: 'divider',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="action" />
                {t('app.statistics.salesByCategory') || 'Sales by Category'}
              </Typography>
              {activeCategoryFilter && (
                <Chip
                  label={t(`app.categories.${activeCategoryFilter}`) || activeCategoryFilter}
                  size="small"
                  onDelete={() => {
                    setActiveCategoryFilter(null);
                    setLogPage(1);
                  }}
                  color="primary"
                  sx={{ borderRadius: 1.5, fontWeight: 600 }}
                />
              )}
            </Stack>

            {activeMetrics.totalRevenue > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                {/* SVG Donut Circle Canvas with increased sizes for perfect word spacing */}
                <Box sx={{ position: 'relative', width: 220, height: 220, mb: 3 }}>
                  <svg viewBox="0 0 200 200" width="100%" height="100%">
                    {(() => {
                      const radius = 65;
                      const circumference = 2 * Math.PI * radius; // 408.4
                      let accumulatedPercentage = 0;

                      return categoryBreakdown.map((cat, index) => {
                        const val = cat.value;
                        const pct = val / activeMetrics.totalRevenue;
                        if (pct === 0) return null;

                        const strokeDash = pct * circumference;
                        const strokeOffset = -accumulatedPercentage * circumference;
                        
                        accumulatedPercentage += pct;

                        const isHovered = hoveredCategoryIndex === index;

                        return (
                          <circle
                            key={cat.name}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke={cat.color}
                            strokeWidth={isHovered ? 22 : 16}
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            strokeDashoffset={strokeOffset}
                            transform="rotate(-90 100 100)"
                            style={{ 
                              transition: 'stroke-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease',
                              cursor: 'pointer',
                              filter: isHovered ? 'drop-shadow(0px 0px 4px rgba(0,0,0,0.15))' : 'none'
                            }}
                            onMouseEnter={() => setHoveredCategoryIndex(index)}
                            onMouseLeave={() => setHoveredCategoryIndex(null)}
                            onClick={() => {
                              setActiveCategoryFilter(activeCategoryFilter === cat.name ? null : cat.name);
                              setLogPage(1);
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Absolute Center summary values with dynamic scaling font sizes */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)', 
                      textAlign: 'center',
                      pointerEvents: 'none',
                      width: '85%',
                      overflow: 'hidden'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.5px', mb: 0.2 }}>
                      {donutCenterText.subtitle}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', my: 0.2, fontSize: valueFontSize, transition: 'font-size 0.2s', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {donutCenterText.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.72rem' }}>
                      {donutCenterText.subText}
                    </Typography>
                  </Box>
                </Box>

                {/* Legend Row */}
                <Grid container spacing={1} sx={{ width: '100%' }}>
                  {categoryBreakdown.map((cat, idx) => {
                    const isSelected = activeCategoryFilter === cat.name;
                    return (
                      <Grid size={{ xs: 6 }} key={cat.name}>
                        <Box 
                          sx={{ 
                            p: 1, 
                            borderRadius: 2, 
                            border: '1.5px solid', 
                            borderColor: isSelected ? cat.color : 'transparent',
                            bgcolor: isSelected ? `${cat.color}15` : 'transparent',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: isSelected ? `${cat.color}25` : 'action.hover'
                            }
                          }}
                          onClick={() => {
                            setActiveCategoryFilter(activeCategoryFilter === cat.name ? null : cat.name);
                            setLogPage(1);
                          }}
                          onMouseEnter={() => setHoveredCategoryIndex(idx)}
                          onMouseLeave={() => setHoveredCategoryIndex(null)}
                        >
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color }} />
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                              {cat.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                              {formatPrice(cat.value)} ({cat.percent}%)
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 4 }}>
                <CategoryIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.4, mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('app.statistics.noData') || 'No sales recorded'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* LEADERBOARD SECTION */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3, 
          border: '1.5px solid', 
          borderColor: 'divider' 
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LeaderboardIcon color="action" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('app.statistics.topSelling') || 'Item Performance Leaderboard'}
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            {/* SorBy Toggle Controls */}
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(_, newVal) => newVal && setSortBy(newVal)}
              size="small"
              sx={{
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 0,
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }
                }
              }}
            >
              <ToggleButton value="revenue">{t('app.statistics.byRevenue') || 'By Revenue'}</ToggleButton>
              <ToggleButton value="units">{t('app.statistics.byUnits') || 'By Units'}</ToggleButton>
            </ToggleButtonGroup>

            {/* View All Details Dialog trigger */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<GridViewIcon />}
              onClick={() => setShowAllProducts(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2, py: 0.6 }}
            >
              {t('app.statistics.viewAll') || 'View All'}
            </Button>
          </Stack>
        </Stack>

        {itemLeaderboard.length > 0 ? (
          <Grid container spacing={3}>
            {itemLeaderboard.slice(0, 4).map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.product.id}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 2.5, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                    p: 2 
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold', 
                        bgcolor: 'primary.light', 
                        color: 'primary.dark' 
                      }}
                    >
                      #{index + 1}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden', width: '100%' }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                        {item.product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`app.product.categories.${item.product.category}`) || item.product.category}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('app.statistics.sold') || 'Qty Sold'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {item.count} {t('app.statistics.units') || 'units'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('app.statistics.revenue') || 'Sales'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatPrice(item.revenue)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('app.statistics.ofTotal') || 'Wallet Share'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {item.contributionPercent}%
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          width: `${item.contributionPercent}%`, 
                          height: '100%', 
                          bgcolor: 'primary.main', 
                          borderRadius: 3 
                        }} 
                      />
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            {t('app.statistics.noData') || 'No top products found for this query.'}
          </Typography>
        )}
      </Paper>

      {/* UPGRADED INTERACTIVE AUDIT LOG SECTION */}
      <Paper 
        ref={auditLogRef}
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 3, 
          border: '1.5px solid', 
          borderColor: 'divider' 
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptIcon color="action" />
          {t('app.statistics.totalSales') || 'Transaction Audit History'}
        </Typography>

        {/* Live Filter / Search inputs bar */}
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('app.statistics.searchProduct') || 'Search Order ID, product names, cash/card...'}
              value={logSearchQuery}
              onChange={(e) => {
                setLogSearchQuery(e.target.value);
                setLogPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="disabled" />
                  </InputAdornment>
                ),
                endAdornment: logSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setLogSearchQuery('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Chip 
              label={t('app.statistics.allCategories') || 'All Sales'} 
              onClick={() => {
                setActiveCategoryFilter(null);
                setLogPage(1);
              }} 
              variant={activeCategoryFilter === null ? 'filled' : 'outlined'}
              color={activeCategoryFilter === null ? 'primary' : 'default'}
              sx={{ borderRadius: 2 }}
            />
            {['food', 'drink', 'dessert'].map(cat => (
              <Chip
                key={cat}
                label={t(`app.categories.${cat}`) || cat}
                onClick={() => {
                  setActiveCategoryFilter(activeCategoryFilter === cat ? null : cat);
                  setLogPage(1);
                }}
                variant={activeCategoryFilter === cat ? 'filled' : 'outlined'}
                color={activeCategoryFilter === cat ? 'primary' : 'default'}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Grid>
        </Grid>

        {/* Audit Log Paginated list layout */}
        {auditedTransactions.length > 0 ? (
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {paginatedLogs.map((tx, idx) => {
              const isExpanded = expandedTxId === tx.id;
              const txDate = new Date(tx.transaction_date);

              const isCard = tx.payment_method && tx.payment_method.toLowerCase().includes('card');

              return (
                <Card 
                  key={tx.id || idx} 
                  elevation={0}
                  sx={{ 
                    borderRadius: 2.5, 
                    border: '1px solid', 
                    borderColor: isExpanded ? 'primary.light' : 'divider',
                    bgcolor: isExpanded ? (isDarkMode ? 'rgba(143,155,255,0.03)' : 'rgba(143,155,255,0.01)') : 'background.paper',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ListItem 
                    sx={{ 
                      py: 2, 
                      px: { xs: 1.5, sm: 3 }, 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 2,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
                      }
                    }}
                    onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTxId(isExpanded ? null : tx.id);
                        }}
                        sx={{ color: 'primary.main' }}
                      >
                        <ChevronRightIcon 
                          sx={{ 
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }} 
                        />
                      </IconButton>
                      
                      <Chip
                        icon={isCard ? <CreditCardIcon fontSize="small" /> : <EuroIcon fontSize="small" />}
                        label={isCard ? (t('sales.card') || 'Card') : (t('sales.cash') || 'Cash')}
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: isCard ? 'rgba(76,195,255,0.12)' : 'rgba(143,255,155,0.12)',
                          color: isCard ? '#29B6F6' : '#66BB6A',
                          border: '1px solid',
                          borderColor: isCard ? 'rgba(76,195,255,0.2)' : 'rgba(143,255,155,0.2)'
                        }}
                      />
                    </Box>
 
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          Order #{tx.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {txDate.toLocaleDateString('de-DE')} • {txDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          ({tx.items_count} {t('app.statistics.items') || 'units'})
                        </Typography>
                      </Stack>
                    </Box>
 
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', mr: 2 }}>
                        {formatPrice(tx.total_amount)}
                      </Typography>
 
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={t('app.cart.reprintReceipt') || 'Reprint Receipt'}>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReprintReceipt(tx);
                            }}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
 
                        <Tooltip title={t('app.statistics.editTransaction') || 'Edit Sale'}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransactionToEdit(tx);
                              try { 
                                setEditItems(JSON.parse(tx.items_data)); 
                              } catch { 
                                setEditItems([]); 
                              }
                              setEditDialogOpen(true);
                            }}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
 
                        <Tooltip title={t('app.statistics.deleteTransaction')}>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransactionToDelete(tx);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </ListItem>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ px: { xs: 2, sm: 6 }, pb: 2 }}>
                      <Divider sx={{ mb: 1.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                        Purchased Items:
                      </Typography>
                      <List dense disablePadding>
                        {(() => {
                          let items: CartItem[] = [];
                          try {
                            items = JSON.parse(tx.items_data);
                          } catch (e) {}

                          if (!items.length) {
                            return (
                              <Typography variant="body2" color="text.secondary">
                                {t('app.statistics.noProducts') || 'No products details logged'}
                              </Typography>
                            );
                          }

                          return items.map((item, i) => {
                            const prod = products.find(p => p.id === item.product?.id);
                            
                            let catIcon = <BlockIcon fontSize="small" color="disabled" />;
                            if (prod?.category || item.product?.category) {
                              const cat = (prod?.category || item.product?.category || '').toLowerCase();
                              if (cat === 'food') catIcon = <FoodBankIcon fontSize="small" color="info" />;
                              else if (cat === 'drink') catIcon = <CoffeeIcon fontSize="small" color="info" />;
                              else if (cat === 'dessert') catIcon = <CookieIcon fontSize="small" color="info" />;
                              else catIcon = <MiscellaneousServicesIcon fontSize="small" color="warning" />;
                            }

                            const itemPrice = item.product?.price || prod?.price || 0;

                            return (
                              <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  {catIcon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Stack direction="row" spacing={2} justifyContent="space-between">
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {prod ? prod.name : (item.product?.name || t('app.statistics.unknownProduct'))}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {item.quantity} x {formatPrice(itemPrice)} = {formatPrice(item.quantity * itemPrice)}
                                      </Typography>
                                    </Stack>
                                  }
                                />
                              </ListItem>
                            );
                          });
                        })()}
                      </List>
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
            <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.4, mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              {t('app.statistics.noData') || 'No matching transactions logged in this session range.'}
            </Typography>
          </Box>
        )}

        {totalLogPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                disabled={logPage === 1}
                onClick={() => {
                  setLogPage(prev => Math.max(1, prev - 1));
                  auditLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                sx={{ borderRadius: 1.5, textTransform: 'none' }}
              >
                {t('common.previous') || 'Previous'}
              </Button>
              <Typography variant="body2" sx={{ px: 2, display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                {logPage} / {totalLogPages}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={logPage === totalLogPages}
                onClick={() => {
                  setLogPage(prev => Math.min(totalLogPages, prev + 1));
                  auditLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                sx={{ borderRadius: 1.5, textTransform: 'none' }}
              >
                {t('common.next') || 'Next'}
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* STICKY ACTION BUTTONS AT BOTTOM RIGHT PANEL */}
      <Box 
        sx={{
          position: 'fixed',
          right: 0,
          bottom: 0,
          left: 'auto',
          width: 'auto',
          maxWidth: { xs: '100vw', sm: 'calc(100vw - 240px)' },
          bgcolor: 'background.paper',
          zIndex: 1100,
          boxShadow: '0 -8px 30px 0 rgba(0,0,0,0.1)',
          py: 2,
          px: { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          border: '1.5px solid',
          borderColor: 'divider',
          borderBottom: 0,
          borderRight: 0
        }}
      >
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportProductAnalytics}
            disabled={!filteredTransactions.length}
            sx={{ fontWeight: 'bold', borderRadius: 2, px: 2.5 }}
          >
            {t('app.statistics.exportTransactions') || 'Export Data (CSV)'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={!filteredTransactions.length}
            onClick={() => setSignersDialogOpen(true)}
            sx={{ fontWeight: 'bold', borderRadius: 2, px: 2.5 }}
          >
            {t('app.statistics.downloadSummary') || 'PDF Summary'}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={handleClearDatabase}
            sx={{ fontWeight: 'bold', borderRadius: 2, px: 2.5 }}
          >
            {t('app.statistics.clearDatabase') || 'Reset DB'}
          </Button>
        </Stack>
      </Box>

      {/* PDF SIGNERS SETTINGS DRAWER DIALOG */}
      <Dialog 
        open={signersDialogOpen} 
        onClose={() => setSignersDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t('app.signers.setSigners')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Assign names to receiver and deliverer fields for Kermes legal printable sheets.
          </Typography>
          {signers.map((signer, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2.5, alignItems: 'center' }}>
              <TextField
                label={t('app.signers.name') || `Name (${idx + 1})`}
                value={signer.name}
                size="small"
                onChange={e => {
                  const newSigners = [...signers];
                  newSigners[idx].name = e.target.value;
                  setSigners(newSigners);
                }}
                fullWidth
              />
              <TextField
                label={t('app.signers.surname') || `Surname (${idx + 1})`}
                value={signer.surname}
                size="small"
                onChange={e => {
                  const newSigners = [...signers];
                  newSigners[idx].surname = e.target.value;
                  setSigners(newSigners);
                }}
                fullWidth
              />
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 80, fontWeight: 700 }}>
                {idx === 0 ? t('app.signers.receiver') || 'Receiver' : t('app.signers.deliverer') || 'Deliverer'}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSignersDialogOpen(false)} sx={{ borderRadius: 1.5 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              generateSummaryPDF({
                transactions: filteredTransactions,
                signers,
                kursName: kursName,
                date: new Date().toLocaleDateString('de-DE'),
              });
              setSignersDialogOpen(false);
            }}
            sx={{ borderRadius: 1.5 }}
          >
            {t('app.signers.generate') || 'Generate PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* INTERACTIVE DELETE TRANSACTION CONFIRM DIALOG */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t('app.statistics.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('app.statistics.confirmDeleteText')}</Typography>
          {transactionToDelete && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Order ID: #{transactionToDelete.id}</Typography>
              <Typography variant="body2">Revenue: {formatPrice(transactionToDelete.total_amount)}</Typography>
              <Typography variant="body2">Items Count: {transactionToDelete.items_count} units</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                {new Date(transactionToDelete.transaction_date).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 1.5 }}>
            {t('common.cancel')}
          </Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={async () => {
              if (transactionToDelete) {
                await cartTransactionService.deleteTransaction(transactionToDelete.id);
                await loadData();
              }
              setDeleteDialogOpen(false);
              setTransactionToDelete(null);
            }}
            sx={{ borderRadius: 1.5 }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT SALE DIALOG */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t('app.statistics.editSale')}</DialogTitle>
        <DialogContent>
          <List sx={{ mt: 1 }}>
            {editItems.map((item, idx) => {
              const product = products.find(p => p.id === item.product?.id);
              return (
                <ListItem 
                  key={idx} 
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 2, 
                    mb: 1,
                    py: 1, 
                    px: 2 
                  }}
                  secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        inputProps={{ min: 1, style: { width: 50, textAlign: 'center' } }}
                        onChange={e => {
                          const newItems = [...editItems];
                          newItems[idx].quantity = Math.max(1, Number(e.target.value));
                          setEditItems(newItems);
                        }}
                        sx={{ mr: 1 }}
                      />
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => {
                          setEditItems(editItems.filter((_, i) => i !== idx));
                        }}
                      >
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={product ? product.name : (item.product?.name || t('app.statistics.unknownProduct'))}
                    secondary={`Price: ${product ? formatPrice(product.price) : '-'}`}
                  />
                </ListItem>
              );
            })}
          </List>
          
          <Divider sx={{ my: 2.5 }} />

          {/* Add new product panel selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label={t('app.statistics.addProduct')}
              value={editAddProductId !== null ? String(editAddProductId) : ''}
              onChange={e => setEditAddProductId(e.target.value ? Number(e.target.value) : null)}
              sx={{ minWidth: 200, flexGrow: 1 }}
            >
              <MenuItem value="">{t('app.statistics.selectProduct')}</MenuItem>
              {Object.entries(
                products
                  .filter(p => !editItems.some(it => String(it.product?.id) === String(p.id)))
                  .reduce((acc, p) => {
                    acc[p.category] = acc[p.category] || [];
                    acc[p.category].push(p);
                    return acc;
                  }, {} as Record<string, Product[]>)
              ).map(([category, prods]) => [
                <ListSubheader key={category}>{t(`app.product.categories.${category}`) || category}</ListSubheader>,
                prods.map(prod => (
                  <MenuItem key={prod.id} value={prod.id}>{prod.name}</MenuItem>
                ))
              ])}
            </TextField>
            <TextField
              type="number"
              size="small"
              label={t('app.statistics.quantity')}
              value={editAddProductQty}
              onChange={e => setEditAddProductQty(Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1, style: { width: 50, textAlign: 'center' } }}
            />
            <Button
              variant="contained"
              disabled={!editAddProductId}
              onClick={() => {
                const prod = products.find(p => String(p.id) === String(editAddProductId));
                if (prod) {
                  const existingIdx = editItems.findIndex(it => String(it.product?.id) === String(prod.id));
                  if (existingIdx !== -1) {
                    const newItems = [...editItems];
                    newItems[existingIdx].quantity += editAddProductQty;
                    setEditItems(newItems);
                  } else {
                    setEditItems([
                      ...editItems,
                      { 
                        product: { id: prod.id, name: prod.name, price: prod.price, category: prod.category }, 
                        quantity: editAddProductQty 
                      }
                    ]);
                  }
                  setEditAddProductId(null);
                  setEditAddProductQty(1);
                }
              }}
              sx={{ borderRadius: 1.5 }}
            >
              {t('common.add')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ borderRadius: 1.5 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (transactionToEdit) {
                try {
                  const fixedEditItems = editItems.map(item => {
                    const prod = products.find(p => p.id === item.product?.id);
                    if (prod) {
                      return {
                        ...item,
                        product: {
                          id: prod.id,
                          name: prod.name,
                          price: prod.price,
                          category: prod.category,
                          description: prod.description,
                          inStock: prod.inStock
                        }
                      };
                    }
                    return item;
                  });

                  const itemsData = JSON.stringify(fixedEditItems);
                  const itemsCount = fixedEditItems.reduce((count, item) => count + item.quantity, 0);
                  const totalAmount = fixedEditItems.reduce((sum, item) => {
                    return sum + (item.product && typeof item.product.price === 'number' ? item.product.price * item.quantity : 0);
                  }, 0);

                  await cartTransactionService.updateTransaction(transactionToEdit.id, {
                    items_data: itemsData,
                    items_count: itemsCount,
                    total_amount: totalAmount,
                  });
                  await loadData();
                } catch (error) {
                  console.error('Error updating transaction:', error);
                }
              }
              setEditDialogOpen(false);
              setTransactionToEdit(null);
              setEditItems([]);
              setEditAddProductId(null);
              setEditAddProductQty(1);
            }}
            sx={{ borderRadius: 1.5 }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FULL DETAILED INVENTORY ANALYTICS DIALOG */}
      <Dialog 
        open={showAllProducts} 
        onClose={() => setShowAllProducts(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('app.statistics.allSoldItems') || 'All Sold Products Analytics'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <ProductStatsTable
              productStats={itemLeaderboard}
              previousPeriodStats={previousPeriodStats}
              showComparison={priorTransactionsData.isValid}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAllProducts(false)} sx={{ borderRadius: 1.5 }} variant="outlined">
            {t('common.cancel') || 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatisticsPage;