import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
	ArrowRight,
	Check,
	Github,
	Zap,
	Shield,
	Sparkles,
} from 'lucide-react';

import Container from './components/Container';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import { useWallet } from './wallet/WalletProvider';

function SectionTitle({ eyebrow, title, subtitle }) {
	return (
		<div className="mx-auto max-w-2xl text-center">
			{eyebrow ? (
				<div className="text-xs font-semibold tracking-[0.24em] text-white/60">
					{eyebrow}
				</div>
			) : null}
			<h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
				{title}
			</h2>
			{subtitle ? (
				<p className="mt-3 text-base leading-relaxed text-gray-400">{subtitle}</p>
			) : null}
		</div>
	);
}

function GlowBlob({ className, colorClass }) {
	return (
		<div
			className={`pointer-events-none absolute rounded-full blur-3xl ${colorClass} ${className}`}
			aria-hidden="true"
		/>
	);
}

function Hero() {
	const container = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: { staggerChildren: 0.08, delayChildren: 0.1 },
		},
	};

	const item = {
		hidden: { opacity: 0, y: 14 },
		show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
	};

	return (
		<section className="relative overflow-hidden pt-28 sm:pt-32">
			<GlowBlob className="-top-28 left-[-120px] h-[420px] w-[420px]" colorClass="bg-purple-500/25" />
			<GlowBlob className="-top-36 right-[-160px] h-[520px] w-[520px]" colorClass="bg-purple-500/15" />
			<GlowBlob className="bottom-[-220px] left-[30%] h-[520px] w-[520px]" colorClass="bg-pink-500/10" />

			<div className="absolute inset-0 -z-10 falcon-grid opacity-[0.18]" aria-hidden="true" />
			<div className="absolute inset-0 -z-10 falcon-noise opacity-[0.16]" aria-hidden="true" />

			<Container>
				<div className="grid items-center gap-10 lg:grid-cols-12">
					<motion.div
						variants={container}
						initial="hidden"
						animate="show"
						className="lg:col-span-7"
					>
						<motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-white/80 backdrop-blur-md">
							<Sparkles className="h-4 w-4 text-purple-300" />
							Premium Web3 Decision Intelligence
						</motion.div>

						<motion.h1
							variants={item}
							className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-6xl"
						>
							<span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
								Stop Guessing. Start Knowing.
							</span>
						</motion.h1>

						<motion.p variants={item} className="mt-5 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
							Decentralized decision intelligence layer powered by TCN AI models and Internet Computer.
						</motion.p>

						<motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
							<a
								href="#pricing"
								className="group inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:bg-purple-400 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] focus-visible:ring-2 focus-visible:ring-purple-300/60"
							>
								Launch Dashboard
								<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
							</a>
							<div className="text-xs leading-relaxed text-white/60">
								Built for signal-driven operators.
							</div>
						</motion.div>

						<motion.div variants={item} className="mt-10 grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
								<div className="flex items-center gap-2 text-sm font-semibold text-white">
									<Shield className="h-4 w-4 text-purple-300" />
									Trustless by design
								</div>
								<div className="mt-1 text-sm text-gray-400">Runs on the Internet Computer.</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
								<div className="flex items-center gap-2 text-sm font-semibold text-white">
									<Zap className="h-4 w-4 text-purple-300" />
									Fast signal flow
								</div>
								<div className="mt-1 text-sm text-gray-400">Real-time decision support.</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
								<div className="flex items-center gap-2 text-sm font-semibold text-white">
									<Sparkles className="h-4 w-4 text-pink-300" />
									TCN intelligence
								</div>
								<div className="mt-1 text-sm text-gray-400">Optimized for clarity.</div>
							</div>
						</motion.div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.15 }}
						className="relative lg:col-span-5"
					>
						<div className="relative mx-auto max-w-md">
							<div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-purple-500/20 via-fuchsia-500/10 to-pink-500/10 blur-2xl" aria-hidden="true" />

							<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
								<div className="flex items-center justify-between">
									<div className="text-sm font-semibold text-white">Blurred Signal Card</div>
									<div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
										Live
									</div>
								</div>

								<div className="mt-5 grid gap-3">
									<div className="h-9 w-full rounded-xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5" />
									<div className="h-9 w-11/12 rounded-xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5" />
									<div className="h-9 w-10/12 rounded-xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5" />
								</div>

								<div className="mt-6">
									<div className="flex items-center justify-between">
										<div className="text-xs font-semibold text-white/70">Signal Strength</div>
										<div className="text-xs font-semibold text-purple-200">High Confidence</div>
									</div>
									<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
										<div className="h-full w-[82%] rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 shadow-[0_0_18px_rgba(168,85,247,0.45)]" />
									</div>
								</div>

								<div className="mt-6 grid grid-cols-3 gap-3">
									<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
										<div className="text-[11px] font-semibold text-white/70">TCN</div>
										<div className="mt-1 text-sm font-semibold text-white">82%</div>
									</div>
									<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
										<div className="text-[11px] font-semibold text-white/70">Signals</div>
										<div className="mt-1 text-sm font-semibold text-white">140+</div>
									</div>
									<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
										<div className="text-[11px] font-semibold text-white/70">Chains</div>
										<div className="mt-1 text-sm font-semibold text-white">ICP</div>
									</div>
								</div>

								<div className="pointer-events-none absolute inset-0" aria-hidden="true">
									<div className="absolute -left-10 top-10 h-36 w-36 rounded-full bg-purple-500/15 blur-3xl" />
									<div className="absolute -right-14 bottom-8 h-44 w-44 rounded-full bg-pink-500/10 blur-3xl" />
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</Container>
		</section>
	);
}

function Stats() {
	const stats = [
		{ label: 'TCN Accuracy', value: '82%' },
		{ label: 'Daily Signals', value: '140+' },
		{ label: 'Chains', value: 'ICP/BSC/ARB' },
	];

	return (
		<section className="relative mt-14">
			<Container>
				<div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:grid-cols-3 sm:p-6">
					{stats.map((s) => (
						<div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
							<div className="text-xs font-semibold tracking-wide text-white/70">{s.label}</div>
							<div className="mt-2 text-2xl font-semibold text-white">{s.value}</div>
						</div>
					))}
				</div>
			</Container>
		</section>
	);
}

function Features() {
	const features = [
		{
			icon: Shield,
			title: 'On-chain, verifiable execution',
			description: 'Decision intelligence delivered on decentralized infrastructure.',
		},
		{
			icon: Zap,
			title: 'High-signal, low-noise outputs',
			description: 'Designed to reduce uncertainty and accelerate action.',
		},
		{
			icon: Sparkles,
			title: 'TCN AI decision layer',
			description: 'Built around TCN model insights for operators and teams.',
		},
	];

	return (
		<section id="features" className="relative mt-20 scroll-mt-24 sm:mt-24">
			<Container>
				<SectionTitle
					eyebrow="FEATURES"
					title="Cyber-noir intelligence, built for conversion"
					subtitle="A premium, glassmorphic signal experience with focused outcomes."
				/>

				<div className="mt-10 grid gap-4 md:grid-cols-3">
					{features.map((f) => (
						<div
							key={f.title}
							className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
						>
							<div className="absolute -inset-8 opacity-0 blur-2xl transition group-hover:opacity-100" aria-hidden="true">
								<div className="h-full w-full rounded-[40px] bg-gradient-to-r from-purple-500/12 via-fuchsia-500/8 to-pink-500/10" />
							</div>
							<div className="relative">
								<div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
									<f.icon className="h-5 w-5 text-purple-300" />
								</div>
								<div className="mt-4 text-lg font-semibold text-white">{f.title}</div>
								<p className="mt-2 text-sm leading-relaxed text-gray-400">{f.description}</p>
							</div>
						</div>
					))}
				</div>
			</Container>
		</section>
	);
}

function Pricing() {
	return (
		<section id="pricing" className="relative mt-20 scroll-mt-24 sm:mt-24">
			<Container>
				<SectionTitle
					eyebrow="PRICING"
					title="Simple plans. Premium outcomes."
					subtitle="Choose Standard for basics, or Pro for the full intelligence stack."
				/>

				<div className="mt-10 grid gap-4 lg:grid-cols-2">
					<div className="relative rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-md">
						<div className="text-sm font-semibold text-white">Standard</div>
						<div className="mt-2 flex items-end gap-2">
							<div className="text-4xl font-semibold text-white">$7.99</div>
							<div className="pb-1 text-sm text-gray-400">/month</div>
						</div>
						<p className="mt-3 text-sm leading-relaxed text-gray-400">Muted essentials and basic features.</p>

						<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold text-white">
								<Check className="h-4 w-4 text-white/70" />
								Basic features
							</div>
						</div>

						<button
							type="button"
							className="mt-7 w-full rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
						>
							Get Standard
						</button>
					</div>

					<div className="relative overflow-hidden rounded-3xl border border-purple-400/35 bg-white/5 p-7 backdrop-blur-md shadow-[0_0_45px_rgba(168,85,247,0.18)]">
						<div className="absolute -inset-8 bg-gradient-to-r from-purple-500/18 via-fuchsia-500/10 to-pink-500/10 blur-2xl" aria-hidden="true" />
						<div className="relative">
							<div className="flex items-center justify-between gap-4">
								<div className="text-sm font-semibold text-white">Pro</div>
								<div className="rounded-full border border-purple-400/35 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200">
									Recommended
								</div>
							</div>

							<div className="mt-2 flex items-end gap-2">
								<div className="text-4xl font-semibold text-white">$15.00</div>
								<div className="pb-1 text-sm text-gray-400">/month</div>
							</div>

							<div className="mt-6 space-y-3">
								<div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/15">
										<Check className="h-4 w-4 text-purple-200" />
									</div>
									<div>
										<div className="text-sm font-semibold text-white">TCN Score</div>
									</div>
								</div>
								<div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/15">
										<Check className="h-4 w-4 text-purple-200" />
									</div>
									<div>
										<div className="text-sm font-semibold text-white">News Analysis</div>
									</div>
								</div>
								<div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/15">
										<Check className="h-4 w-4 text-purple-200" />
									</div>
									<div>
										<div className="text-sm font-semibold text-white">Whale Tracking</div>
									</div>
								</div>
							</div>

							<button
								type="button"
								className="mt-7 w-full rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:bg-purple-400 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)]"
							>
								Get Pro
							</button>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
}


export default function App() {
	const { isAuthenticated, userPlan, userStatus, address } = useWallet();
	const [currentPage, setCurrentPage] = React.useState('dashboard'); // 'dashboard' | 'wallet'

	return (
		<div className="falcon-bg min-h-screen">
			<Navbar onOpenWallet={() => setCurrentPage('wallet')} />

			<AnimatePresence mode="wait">
				{isAuthenticated ? (
					<motion.main
						key={currentPage}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.18, ease: 'easeOut' }}
					>
						{currentPage === 'wallet' ? (
							<WalletPage 
								address={address} 
								onBack={() => setCurrentPage('dashboard')} 
							/>
						) : (
							<Dashboard 
								plan={userPlan} 
								userPlan={userPlan} 
								status={userStatus} 
								walletType="ii" 
							/>
						)}
					</motion.main>
				) : (
					<motion.main
						key="landing"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.18, ease: 'easeOut' }}
					>
						<Hero />
						<Stats />
						<Features />
						<Pricing />
						<Footer />
					</motion.main>
				)}
			</AnimatePresence>
		</div>
	);
}
