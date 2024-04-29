import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import { useEffect, useRef, useState } from 'react'
gsap.registerPlugin(ScrollTrigger)

import { hightlightsSlides } from '../constants'
import { pauseImg, playImg, replayImg } from '../utils'

const VideoCarousel = () => {
	const videoRef = useRef([])
	const videoSpanRef = useRef([])
	const videoDivRef = useRef([])

	// video and indicator
	const [video, setVideo] = useState({
		isEnd: false,
		startPlay: false,
		videoId: 0,
		isLastVideo: false,
		isPlaying: false,
	})

	const [loadedData, setLoadedData] = useState([])
	const { isEnd, isLastVideo, startPlay, videoId, isPlaying } = video

	useGSAP(() => {
		// slider animation to move the video out of the screen and bring the next video in
		gsap.to('#slider', {
			transform: `translateX(${-100 * videoId}%)`,
			duration: 2,
			ease: 'power2.inOut', // show visualizer https://gsap.com/docs/v3/Eases
		})

		// video animation to play the video when it is in the view
		gsap.to('#video', {
			scrollTrigger: {
				trigger: '#video',
				toggleActions: 'restart none none none',
			},
			onComplete: () => {
				setVideo(pre => ({
					...pre,
					startPlay: true,
					isPlaying: true,
				}))
			},
		})
	}, [isEnd, videoId])

	useEffect(() => {
		let currentProgress = 0
		let span = videoSpanRef.current

		if (span[videoId]) {
			// animation to move the indicator
			let anim = gsap.to(span[videoId], {
				onUpdate: () => {
					// get the progress of the video
					const progress = Math.ceil(anim.progress() * 100)

					if (progress != currentProgress) {
						currentProgress = progress

						// set the width of the progress bar
						gsap.to(videoDivRef.current[videoId], {
							width:
								window.innerWidth < 760
									? '10vw' // mobile
									: window.innerWidth < 1200
										? '10vw' // tablet
										: '4vw', // laptop
						})

						// set the background color of the progress bar
						gsap.to(span[videoId], {
							width: `${currentProgress}%`,
							backgroundColor: 'white',
						})
					}
				},

				// when the video is ended, replace the progress bar with the indicator and change the background color
				onComplete: () => {
					if (isPlaying) {
						gsap.to(videoDivRef.current[videoId], {
							width: '12px',
						})
						gsap.to(span[videoId], {
							backgroundColor: '#afafaf',
						})
					}
				},
			})

			if (videoId == 0) {
				anim.restart()
			}

			// update the progress bar
			const animUpdate = () => {
				anim.progress(
					videoRef.current[videoId].currentTime /
						hightlightsSlides[videoId].videoDuration
				)
			}

			if (isPlaying) {
				// ticker to update the progress bar
				gsap.ticker.add(animUpdate)
			} else {
				// remove the ticker when the video is paused (progress bar is stopped)
				gsap.ticker.remove(animUpdate)
			}
		}
	}, [videoId, startPlay])

	useEffect(() => {
		if (loadedData.length > 3) {
			if (!isPlaying) {
				videoRef.current[videoId].pause()
			} else {
				startPlay && videoRef.current[videoId].play()
			}
		}
	}, [startPlay, videoId, isPlaying, loadedData])

	// vd id is the id for every video until id becomes number 3
	const handleProcess = (type, i) => {
		switch (type) {
			case 'video-end':
				setVideo(pre => ({ ...pre, isEnd: true, videoId: i + 1 }))
				break

			case 'video-last':
				setVideo(pre => ({ ...pre, isLastVideo: true }))
				break

			case 'video-reset':
				setVideo(pre => ({ ...pre, videoId: 0, isLastVideo: false }))
				break

			case 'pause':
				setVideo(pre => ({ ...pre, isPlaying: !pre.isPlaying }))
				break

			case 'play':
				setVideo(pre => ({ ...pre, isPlaying: !pre.isPlaying }))
				break

			default:
				return video
		}
	}

	const handleLoadedMetaData = (i, e) => setLoadedData(pre => [...pre, e])

	useGSAP(() => {
		const trigObj = {
			trigger: '#video',
			start: 'center 80%',
			end: 'center 0%',
			toggleActions: 'restart none resume reverse',
		}
		const tl = gsap.timeline({
			scrollTrigger: trigObj,
		})

		tl.from(
			'#bar-video',
			{
				yPercent: 100,
				ease: 'back.out(2)',
				opacity: 0,
				duration: 0.5,
			},
			'<'
		)
		tl.from(
			'#cont-1-video',
			{
				scaleX: 0,
				opacity: 0,
				ease: 'back.out(2)',
				x: 35,
				duration: 0.5,
			},
			'-=0.4'
		)
		tl.from(
			'#cont-2-video',
			{
				width: '56px',
				ease: 'back.out(2)',
				duration: 0.5,
				x: -35,
			},
			'<'
		)
		tl.from(
			'#color-video',
			{
				opacity: 0,
				scale: 0,
				ease: 'back.out(2)',
				duration: 0.5,
				stagger: {
					amount: 0.2,
					from: 'end',
				},
			},
			'-=0.2'
		)
		tl.from(
			'#size1-video',
			{
				opacity: 0,
				ease: 'back.out(2)',
				duration: 0.5,
				scale: 0.5,
				stagger: 0.2,
			},
			'<'
		)
	}, [])

	return (
		<>
			<div className='flex items-center overflow-hidden rounded-3xl'>
				{hightlightsSlides.map((list, i) => (
					<div key={list.id} id='slider' className='sm:pr-20 pr-10'>
						<div className='video-carousel_container'>
							<div className='w-full h-full flex-center rounded-3xl overflow-hidden bg-black'>
								<video
									id='video'
									playsInline={true}
									className={`max-w-[100%] ${
										list.id === 2 && 'translate-x-44'
									} ${i === 0 || i === 2 ? 'object-cover' : null} pointer-events-none w-full h-full	`}
									preload='auto'
									muted
									ref={el => (videoRef.current[i] = el)}
									onEnded={() =>
										i !== 3
											? handleProcess('video-end', i)
											: handleProcess('video-last')
									}
									onPlay={() => setVideo(pre => ({ ...pre, isPlaying: true }))}
									onLoadedMetadata={e => handleLoadedMetaData(i, e)}
								>
									<source src={list.video} type='video/mp4' />
								</video>
							</div>

							<div className='absolute top-12 left-[5%] z-10'>
								{list.textLists.map((text, i) => (
									<p key={i} className='md:text-2xl text-xl font-medium'>
										{text}
									</p>
								))}
							</div>
						</div>
					</div>
				))}
			</div>

			<div
				id='bar-video'
				className='flex-center flex-col sticky bottom-[30px] mt-10'
			>
				<div
					id='color-cont-video'
					className='flex-center relative rounded-full'
				>
					<div
						id='cont-1-video'
						className='flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full'
					>
						{videoRef.current.map((_, i) => (
							<span
								key={i}
								id='color-video'
								className='mx-2 min-w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer'
								ref={el => (videoDivRef.current[i] = el)}
							>
								<span
									className='absolute h-full w-full rounded-full min-w-3'
									ref={el => (videoSpanRef.current[i] = el)}
								/>
							</span>
						))}
					</div>

					<button
						id='cont-2-video'
						onClick={
							isLastVideo
								? () => handleProcess('video-reset')
								: !isPlaying
									? () => handleProcess('play')
									: () => handleProcess('pause')
						}
						className='control-btn'
					>
						<img
							id='size1-video'
							src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
							alt={isLastVideo ? 'replay' : !isPlaying ? 'play' : 'pause'}
						/>
					</button>
				</div>
			</div>
		</>
	)
}

export default VideoCarousel
