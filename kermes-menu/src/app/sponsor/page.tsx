"use client";
import PageContainer from '../components/PageContainer';
import Image from 'next/image';
import { useState } from 'react';

const IMAGE_WIDTH = 275;
const IMAGE_HEIGHT = 250;

const sponsorImages = [
	{ src: '/sponsor/MPG.jpg', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/Kontinental.jpg', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/Dogancan.jpg', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/Soybir.jpg', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/Demirel.png', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/Mina.jpg', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/Kösem.png', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/CanSupermarkt.png', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/Hisar.jpg', alt: 'Sponsor Resimler' },
	{ src: '/sponsor/EuroBazar.jpg', alt: 'Sponsor Resimler' },
	// Add more images here as needed
	// Example:
	// { src: '/another-image.jpg', alt: 'Another Sponsor' },
];

export default function SponsorPage() {
	const [imgError, setImgError] = useState(Array(sponsorImages.length).fill(false));

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