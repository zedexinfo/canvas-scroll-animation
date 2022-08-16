const imageBaseUrl =
  "https://oloidstaging.wpengine.com/wp-content/uploads/animation/compressedv2.1";
class VideoSection {
  videoWrapper;

  totalFrames;

  activeFrame;

  isImagesLoaded = false;
  loadedImages = [];
  images = [];

  sectionIndex;

  canvas;

  canvasContext;

  videoStartOffset;

  frameStartOffsets = [];

  frameDuration;

  filePath;
  /**
   *
   * @param {HTMLDivElement} videoWrapper
   * @param {number} sectionIndex
   */
  constructor(videoWrapper, sectionIndex) {
    this.videoWrapper = videoWrapper;
    this.sectionIndex = sectionIndex;
    this.init();
  }

  init() {
    this.totalFrames = Number(
      this.videoWrapper.getAttribute("data-total-frames")
    );
    this.activeFrame = 0;
    this.filePath = `animation-${this.sectionIndex + 1}`;
    this.totalFrames = Number(this.videoWrapper.dataset.totalFrames);
    this.loadedImages = Array(this.totalFrames).fill(false);
    this.initCanvas();
    //this.storeImages();
    // setTimeout(() => this.renderImage(), 2000);
  }

  loadImages() {
    return new Promise((resolve) => {
      for (let i = 0; i < this.totalFrames; i++) {
        let img = new Image();

        const loader = () => {
          this.loadedImages[i] = true;

          if (i === 0) {
            this.renderImage();
          }

          const isImagesLoaded = this.loadedImages.every((loaded) => loaded);

          if (isImagesLoaded) {
            resolve(isImagesLoaded);
          }
        };

        img.onload = loader;
        img.onerror = loader;

        img.src = this.getImageForFrame(i);
        this.images.push(img);
      }
    });
  }

  getImageForFrame = (index) =>
    `${imageBaseUrl}/${this.filePath}/${index + 1}.png`;

  initCanvas() {
    this.canvas = this.videoWrapper.getElementsByTagName("canvas").item(0);
    this.canvasContext = this.canvas.getContext("2d");
    this.canvas.width = 1920;
    this.canvas.height = 1080;
  }

  renderImage() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasContext.drawImage(this.images[this.activeFrame], 0, 0);
    // console.log(this.canvas);
    // console.log(this.canvasContext);
    // console.log(this.images[this.activeFrame]);
  }

  setStartOffsetOfFrames(videoDuration) {
    this.frameDuration = videoDuration / this.totalFrames;
    let currentFrameStartOffset = 0;
    for (let i = 0; i <= this.totalFrames; i++) {
      if (i === 0) {
        currentFrameStartOffset = this.videoStartOffset;
      } else {
        currentFrameStartOffset = currentFrameStartOffset + this.frameDuration;
      }

      this.frameStartOffsets.push(currentFrameStartOffset);
    }
  }

  setOffsetTop(videoStartOffset, videoDuration) {
    this.videoStartOffset = videoStartOffset;
    this.setStartOffsetOfFrames(videoDuration);
  }

  onScroll(scrollPosition) {
    for (let i = 0; i < this.frameStartOffsets.length; i++) {
      const startOffset = this.frameStartOffsets[i];
      if (
        scrollPosition > startOffset &&
        scrollPosition <= this.frameStartOffsets[i + 1]
      ) {
        this.activeFrame = i;
        this.renderImage();
        break;
      }
    }
  }

  hide() {
    this.videoWrapper.classList.add("hide");
  }

  show() {
    this.videoWrapper.classList.remove("hide");
  }
}

class VideoSectionWrapper {
  /** @type {HTMLDivElement} */
  wrapperElement;

  /** @type {HTMLTableSectionElement}  */
  mainWrapper;

  /** @type {HTMLCollection} */
  videoSectionElements;

  /** @type {VideoSection[]} */
  videoSections = [];

  activeVideoSection;

  videoSectionStartOffsets = [];

  totalSections;

  /**
   *
   * @param {HTMLTableSectionElement} mainWrapper
   */
  constructor(mainWrapper) {
    this.mainWrapper = mainWrapper;
    this.init();
    this.calculateStartOffsetOfVideos();
  }

  async init() {
    this.wrapperElement = this.mainWrapper
      .getElementsByClassName("video-set")
      .item(0);
    // console.log("item 0 is ", this.wrapperElement);
    this.videoSectionElements =
      this.mainWrapper.getElementsByClassName("video-wrapper");
    this.totalSections = this.videoSectionElements.length;
    for (let i = 0; i < this.totalSections; i++) {
      this.videoSections.push(
        new VideoSection(this.videoSectionElements.item(i), i)
      );
    }
  }

  loadImages() {
    return Promise.all(this.videoSections.map((video) => video.loadImages()));
  }

  calculateStartOffsetOfVideos() {
    const mainWrapperHeight = this.mainWrapper.offsetHeight;
    // console.log("mainwrapper height", mainWrapperHeight);
    console.log(mainWrapperHeight);
    // const videoDuration = (mainWrapperHeight / this.totalSections) - 100; // need to figure out the value of 100
    const videoDuration = mainWrapperHeight / this.totalSections;

    console.log({ videoDuration });
    // console.log("video duration", videoDuration);

    const mainWrapperOffsetTop = this.mainWrapper.offsetTop;
    // console.log("offset duration", mainWrapperOffsetTop);
    let currentStartOffset = 0;
    for (let i = 0; i <= this.totalSections; i++) {
      if (i === 0) {
        currentStartOffset = mainWrapperOffsetTop;
      } else {
        currentStartOffset = currentStartOffset + videoDuration;
      }
      if (i < this.totalSections) {
        this.videoSections[i].setOffsetTop(currentStartOffset, videoDuration);
      }
      this.videoSectionStartOffsets.push(currentStartOffset);
    }
  }

  onScroll(scrollPosition) {
    // get active section based on top offset
    for (let index = 0; index < this.videoSectionStartOffsets.length; index++) {
      const topOffset = this.videoSectionStartOffsets[index];
      if (
        scrollPosition > topOffset &&
        scrollPosition <= this.videoSectionStartOffsets[index + 1]
      ) {
        this.handleSectionScroll(index, scrollPosition);
        break;
      }
    }
  }

  handleSectionScroll(index, scrollPosition) {
    if (index !== this.activeVideoSection) {
      this.activeVideoSection = index;
      for (let i = 0; i < this.videoSections.length; i++) {
        if (i === index) {
          this.videoSections[i].show();
        } else {
          this.videoSections[i].hide();
        }
      }
    }
    this.videoSections[this.activeVideoSection].onScroll(scrollPosition);
  }
}

class VideoSlider {
  totalSections;

  mainWrapper;
  mainWrapperHeight;
  mainWrapperTopOffset;

  windowHeight;

  /** @type {VideoSectionWrapper} */
  videoSectionWrapper;

  /**
   *
   * @param {HTMLTableSectionElement} mainWrapper
   */
  constructor(mainWrapper) {
    this.mainWrapper = mainWrapper;

    this.initDomElements();
    this.initDimensions();
    this.initVideoSectionWrapper();
    this.initObserver();
  }

  initDomElements() {
    this.totalSections = this.mainWrapper.getAttribute("data-total-sections");
  }

  initDimensions() {
    this.mainWrapperHeight = this.mainWrapper.offsetHeight;
    // console.log("offset height is ", this.mainWrapperHeight);

    this.mainWrapperTopOffset = this.mainWrapper.offsetTop;
    // console.log("offset top is ", this.mainWrapperTopOffset);

    this.windowHeight = window.innerHeight;
    // console.log("window height is ", this.windowHeight);
  }

  initVideoSectionWrapper() {
    this.videoSectionWrapper = new VideoSectionWrapper(this.mainWrapper);
    this.videoSectionWrapper.loadImages().then((response) => {
      document.getElementById("mtag-preloader-slider").remove();
    });
    // console.log("videosection is", this.videoSectionWrapper);
  }

  initObserver() {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.8,
    };
    // console.log("on start scroll position", window.pageYOffset);
    const observer = new IntersectionObserver(this.initScrollListener, options);
    observer.observe(this.videoSectionWrapper.wrapperElement);
  }

  initScrollListener = (entries) => {
    this.handleScrollEvent();
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // console.log("intersecting");
        window.addEventListener("scroll", this.handleScrollEvent);
      } else {
        // console.log("not intersecting");
        removeEventListener("scroll", this.handleScrollEvent);
      }
    });
  };

  handleScrollEvent = (e) => {
    // console.log(
    //   "scolling window",
    //   window.pageYOffset +
    //     (window.pageYOffset * this.windowHeight) /
    //       (this.mainWrapperHeight - this.windowHeight)
    // );
    this.videoSectionWrapper.onScroll(
      window.pageYOffset +
        (window.pageYOffset * this.windowHeight) /
          (this.mainWrapperHeight - this.windowHeight)
    );
  };

  handleScreenResize() {
    this.initDimensions();
    this.videoSectionWrapper.calculateStartOffsetOfVideos();
  }
}

(function (w, d) {
  function init() {
    const video_frame_wrappers = d.getElementsByClassName(
      "video_frame_wrapper"
    );

    for (let i = 0; i < video_frame_wrappers.length; i++) {
      // console.log(video_frame_wrappers[i]);
      new VideoSlider(video_frame_wrappers[i]);
    }
  }
  window.onload = init;
})(window, document);
