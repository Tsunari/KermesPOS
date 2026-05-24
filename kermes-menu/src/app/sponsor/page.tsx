"use client";
import { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import LoadingScreen from '../components/LoadingScreen';
import Image from 'next/image';
import { useActiveKermes } from '../hooks/useActiveKermes';

const IMAGE_WIDTH = 275;
const IMAGE_HEIGHT = 250;

const DEFAULT_SPONSOR_IMAGES = [
	{ src: '/kermeses/template-basic/sponsor/01.svg', alt: 'Sponsor Alanı 1' },
	{ src: '/kermeses/template-basic/sponsor/02.svg', alt: 'Sponsor Alanı 2' },
	{ src: '/kermeses/template-basic/sponsor/03.svg', alt: 'Sponsor Alanı 3' },
];

export default function SponsorPage() {
	const { kermesData, loading } = useActiveKermes();
	const [sponsorImages, setSponsorImages] = useState(DEFAULT_SPONSOR_IMAGES);
	const [imgError, setImgError] = useState(Array(DEFAULT_SPONSOR_IMAGES.length).fill(false));

	useEffect(() => {
		if (loading) return;
		const nextImages = (kermesData?.sponsorImages ?? []).map((src) => ({
			src,
			alt: 'Sponsor Resimler',
		}));

		const activeImages = nextImages.length > 0 ? nextImages : DEFAULT_SPONSOR_IMAGES;
		setSponsorImages(activeImages);
		setImgError(Array(activeImages.length).fill(false));
	}, [kermesData, loading]);

	const handleImgError = (idx: number) => {
		setImgError(prev => {
			const copy = [...prev];
			copy[idx] = true;
			return copy;
		});
	};

	if (loading) {
		return (
			<PageContainer>
				<LoadingScreen />
			</PageContainer>
		);
	}

	return (
		<PageContainer>
			<div className="w-full grid grid-cols-1 gap-6 mt-8">
				{sponsorImages.map((img, idx) => (
					<div
						key={img.src}
						className={`flex items-center w-full justify-center`}
					>
						{!imgError[idx] ? (
							<Image
								src={img.src}
								alt={img.alt}
								width={IMAGE_WIDTH}
								height={IMAGE_HEIGHT}
								className="rounded-2xl shadow-lg object-contain outline-2 outline-black"
								style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
								priority
								onError={() => handleImgError(idx)}
							/>
						) : (
							<div
								className="rounded-2xl shadow-lg outline-2 outline-black flex items-center justify-center bg-gray-200"
								style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, maxWidth: '100%', minHeight: 200 }}
							>
								<span className="text-black text-xl font-semibold text-center w-full block">{img.alt}</span>
							</div>
						)}
					</div>
				))}
			</div>
		</PageContainer>
	);
}