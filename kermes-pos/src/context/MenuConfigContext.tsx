import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type MenuConfig = {
    title: string;
    currency: string;
    showCategories: boolean;
    columns: number; // 1-3 columns optional future use
    fontSize: number; // base font size in px
};

export const defaultMenuConfig: MenuConfig = {
    title: 'Menu',
    currency: '€',
    showCategories: true,
    columns: 2,
    fontSize: 16,
};

const MenuConfigContext = createContext<{
    config: MenuConfig;
    setConfig: React.Dispatch<React.SetStateAction<MenuConfig>>;
    resetConfig: () => void;
}>({ config: defaultMenuConfig, setConfig: () => { }, resetConfig: () => { } });

export const MenuConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<MenuConfig>(() => {
        try {
            const raw = localStorage.getItem('kermes.menu.config.v1');
            return raw ? { ...defaultMenuConfig, ...JSON.parse(raw) } : defaultMenuConfig;
        } catch {
            return defaultMenuConfig;
        }
    });
    useEffect(() => {
        try { localStorage.setItem('kermes.menu.config.v1', JSON.stringify(config)); } catch { }
    }, [config]);
    const resetConfig = () => setConfig(defaultMenuConfig);
    const value = useMemo(() => ({ config, setConfig, resetConfig }), [config]);
    return <MenuConfigContext.Provider value={value}>{children}</MenuConfigContext.Provider>;
};

export const useMenuConfig = () => useContext(MenuConfigContext);
