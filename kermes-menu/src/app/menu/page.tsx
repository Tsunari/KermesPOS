"use client";
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import CenteredImage from '../components/CenteredImage';
import PageContainer from '../components/PageContainer';
import { db } from '../../../firebaseInit';

const SETTINGS_DOC = 'settings/main';

type KermesSettings = {
    active: boolean;
    activeKermesId: string;
};

type KermesRecord = {
    menuImage: string;
    assetFolder: string;
};

export default function MenuPage() {
    const [settings, setSettings] = useState<KermesSettings | null>(null);
    const [menuImages, setMenuImages] = useState<string[]>(['/kermeses/template-basic/menu.svg']);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, SETTINGS_DOC), (snap) => {
            if (snap.exists()) {
                setSettings({
                    active: snap.data()?.active ?? false,
                    activeKermesId: snap.data()?.activeKermesId ?? '',
                });
            } else {
                setSettings(null);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!settings?.activeKermesId) {
            setMenuImages(['/kermeses/template-basic/menu.svg']);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'kermeses', settings.activeKermesId), (snap) => {
            if (snap.exists()) {
                const data = snap.data() as Partial<KermesRecord>;
                const rawImage = data.menuImage || '/kermeses/template-basic/menu.svg';
                const images = rawImage
                    .split(/[\n,]+/)
                    .map((item) => item.trim())
                    .filter(Boolean);
                
                setMenuImages(images.length > 0 ? images : ['/kermeses/template-basic/menu.svg']);
            } else {
                setMenuImages(['/kermeses/template-basic/menu.svg']);
            }
        });

        return () => unsubscribe();
    }, [settings?.activeKermesId]);

    return (
        <PageContainer>
            <div className="flex flex-col gap-6 w-full items-center">
                {menuImages.map((src, index) => (
                    <CenteredImage
                        key={index}
                        src={src}
                        alt={`Menu Sayfa ${index + 1}`}
                        priority={index === 0}
                    />
                ))}
            </div>
        </PageContainer>
    );
}