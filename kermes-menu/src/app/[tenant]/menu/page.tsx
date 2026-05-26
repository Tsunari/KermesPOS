"use client";
import CenteredImage from '../../components/CenteredImage';
import PageContainer from '../../components/PageContainer';
import LoadingScreen from '../../components/LoadingScreen';
import { useActiveKermes } from '../../hooks/useActiveKermes';

export default function MenuPage() {
    const { kermesData, loading } = useActiveKermes();

    const rawImage = kermesData?.menuImage || '/kermeses/template-basic/menu.svg';
    const menuImages = rawImage.split(/[\n,]+/).map((src) => src.trim()).filter(Boolean);

    if (loading) {
        return (
            <PageContainer>
                <LoadingScreen />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="flex flex-col gap-4 w-full items-center">
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