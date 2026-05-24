"use client";
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import PageContainer from '../components/PageContainer';
import CenteredImage from '../components/CenteredImage';
import { db } from '../../../firebaseInit';

const SETTINGS_DOC = 'settings/main';

type KermesSettings = {
    active: boolean;
    activeKermesId: string;
};

type KermesRecord = {
    festivalImage: string;
    assetFolder: string;
};

export default function FestivalPage() {
    const [settings, setSettings] = useState<KermesSettings | null>(null);
    const [festivalImages, setFestivalImages] = useState<string[]>(['/kermeses/template-basic/festival.svg']);

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
            setFestivalImages(['/kermeses/template-basic/festival.svg']);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'kermeses', settings.activeKermesId), (snap) => {
            if (snap.exists()) {
                const data = snap.data() as Partial<KermesRecord>;
                const rawImage = data.festivalImage || '/kermeses/template-basic/festival.svg';
                const images = rawImage
                    .split(/[\n,]+/)
                    .map((item) => item.trim())
                    .filter(Boolean);
                
                setFestivalImages(images.length > 0 ? images : ['/kermeses/template-basic/festival.svg']);
            } else {
                setFestivalImages(['/kermeses/template-basic/festival.svg']);
            }
        });

        return () => unsubscribe();
    }, [settings?.activeKermesId]);

    return (
        <PageContainer>
            <div className="flex flex-col gap-6 w-full items-center">
                {festivalImages.map((src, index) => (
                    <CenteredImage
                        key={index}
                        src={src}
                        alt={`Festival Görseli ${index + 1}`}
                        priority={index === 0}
                    />
                ))}
            </div>
        </PageContainer>
    );
}
