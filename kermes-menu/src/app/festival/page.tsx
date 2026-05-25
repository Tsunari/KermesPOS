"use client";
import PageContainer from '../components/PageContainer';
import CenteredImage from '../components/CenteredImage';
import LoadingScreen from '../components/LoadingScreen';
import { useActiveKermes } from '../hooks/useActiveKermes';

export default function FestivalPage() {
    const { kermesData, loading } = useActiveKermes();

    const rawImage = kermesData?.festivalImage || '/kermeses/template-basic/festival.svg';
    const festivalImages = rawImage.split(/[\n,]+/).map((src) => src.trim()).filter(Boolean);

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
