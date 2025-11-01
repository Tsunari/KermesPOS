import React, { useEffect, useMemo } from 'react';
import { useVariableContext } from '../context/VariableContext';
import { useMenuConfig } from '../context/MenuConfigContext';

const STORAGE_KEY = 'kermes.menu.data.v1';
const CHANNEL = 'kermes-menu-channel';

const MenuDataBridge: React.FC = () => {
    const { products } = useVariableContext();
    const { config } = useMenuConfig();

    const payload = useMemo(() => {
        const items = (products || []).filter((p: any) => !p.hidden).map((p: any) => ({ id: p.id, name: p.name, price: p.price, category: p.category }));
        return {
            title: config.title || 'Menu',
            currency: config.currency || '€',
            showCategories: config.showCategories ?? true,
            columns: config.columns || 1,
            fontSize: config.fontSize || 16,
            items
        };
    }, [products, config]);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { }
        try {
            const bc = new BroadcastChannel(CHANNEL);
            bc.postMessage({ type: 'menu:data', payload });
            // leave channel open; component will be long-lived
        } catch { }
    }, [payload]);

    return null;
};

export default MenuDataBridge;
