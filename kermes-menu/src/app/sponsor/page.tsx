"use client";
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import PageContainer from '../components/PageContainer';
import Image from 'next/image';
import { db } from '../../../firebaseInit';

const IMAGE_WIDTH = 275;
const IMAGE_HEIGHT = 250;

const DEFAULT_SPONSOR_IMAGES = [
	{ src: '/kermeses/template-basic/sponsor/01.svg', alt: 'Sponsor Alanı 1' },
	{ src: '/kermeses/template-basic/sponsor/02.svg', alt: 'Sponsor Alanı 2' },
	{ src: '/kermeses/template-basic/sponsor/03.svg', alt: 'Sponsor Alanı 3' },
];

const SETTINGS_DOC = 'settings/main';

type KermesSettings = {
	active: boolean;
	activeKermesId: string;
};

type KermesRecord = {
	sponsorImages: string[];
};

export default function SponsorPage() {
	const [settings, setSettings] = useState<KermesSettings | null>(null);
	const [sponsorImages, setSponsorImages] = useState(DEFAULT_SPONSOR_IMAGES);
	const [imgError, setImgError] = useState(Array(DEFAULT_SPONSOR_IMAGES.length).fill(false));

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
			setSponsorImages(DEFAULT_SPONSOR_IMAGES);
			setImgError(Array(DEFAULT_SPONSOR_IMAGES.length).fill(false));
			return;
		}

		const unsubscribe = onSnapshot(doc(db, 'kermeses', settings.activeKermesId), (snap) => {
			if (snap.exists()) {
				const data = snap.data() as Partial<KermesRecord>;
				const nextImages = (data.sponsorImages ?? []).map((src) => ({
					src,
					alt: 'Sponsor Resimler',
				}));

				setSponsorImages(nextImages.length > 0 ? nextImages : DEFAULT_SPONSOR_IMAGES);
				setImgError(Array((nextImages.length > 0 ? nextImages : DEFAULT_SPONSOR_IMAGES).length).fill(false));
			} else {
				setSponsorImages(DEFAULT_SPONSOR_IMAGES);
				setImgError(Array(DEFAULT_SPONSOR_IMAGES.length).fill(false));
			}
		});

		return () => unsubscribe();
	}, [settings?.activeKermesId]);

	const handleImgError = (idx: number) => {
		setImgError(prev => {
			const copy = [...prev];
			copy[idx] = true;
			return copy;
		});
	};

	return (
		<PageContainer>
			<div className="w-full grid grid-cols-1 gap-6 mt-8">
				{sponsorImages.map((img, idx) => (
					<div
						key={img.src}
						className={`flex items-center w-full ${idx % 2 === 0 ? 'justify-center' : 'justify-center'}`}
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