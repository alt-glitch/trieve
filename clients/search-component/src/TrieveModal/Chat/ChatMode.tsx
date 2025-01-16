import React, { Suspense, useEffect, useRef, useState } from "react";
import { useModalState } from "../../utils/hooks/modal-context";
import { useChatState } from "../../utils/hooks/chat-context";
import { ChatMessage } from "./ChatMessage";
import { Tags } from "../Tags";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { UploadImage } from "../Search/UploadImage";
import ImagePreview from "../ImagePreview";
import { AnimatePresence } from "motion/react";
import { cn } from "../../utils/styles";
import { UploadAudio } from "../Search/UploadAudio";

export const ChatMode = () => {
  const {
    props,
    modalRef,
    open,
    setOpen,
    mode,
    currentGroup,
    uploadingImage,
    imageUrl,
  } = useModalState();
  const {
    askQuestion,
    messages,
    currentQuestion,
    cancelGroupChat,
    setCurrentQuestion,
    clearConversation,
    isDoneReading,
    stopGeneratingMessage,
  } = useChatState();

  const chatInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode == "chat" && open) {
      chatInput.current?.focus();
    }
  }, [chatInput, mode, open]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const scrollHeight = e.currentTarget.scrollHeight;
    const clientHeight = e.currentTarget.clientHeight;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    setScrollPercentage(scrollPercentage);
    console.log(`scrollPercentage: ${scrollPercentage} `);
  };

  // Get shadow intensity
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const scrollHeight = scrollRef.current.scrollHeight;
      const clientHeight = scrollRef.current.clientHeight;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      if (Number.isNaN(scrollPercentage)) {
        setScrollPercentage(0);
      } else {
        setScrollPercentage(scrollPercentage);
      }
    }
  });

  const [shadowIntensity, setShadowIntensity] = useState(0);

  useEffect(() => {
    console.log(`percentage: ${scrollPercentage}`);
    // console.log(`intnsity: ${shadowIntensity}`);
  }, [shadowIntensity, scrollPercentage]);
  return (
    <Suspense fallback={<div className="suspense-fallback"></div>}>
      {props.inline && messages.length ? (
        <div className="inline-chat-header">
          <div>
            <p>{props.inlineHeader}</p>
          </div>
          <button
            onClick={() =>
              isDoneReading ? clearConversation() : stopGeneratingMessage()
            }
            className="clear-button"
          >
            {isDoneReading ? "Clear" : "Stop"}
          </button>
        </div>
      ) : null}
      <div
        onScroll={handleScroll}
        className={cn(
          `chat-outer-wrapper tv-relative tv-overflow-hidden tv-flex tv-flex-col tv-px-4 tv-scroll-smooth !tv-mt-0`,
          props.inline &&
            "chat-outer-popup md:tv-mt-0 lg:tv-mt-0 2xl:tv-mt-0 tv-mt-0 sm:!tv-mt-0",
          !props.inline && "chat-outer-inline tv-min-h-[175px]",
        )}
        ref={modalRef}
      >
        {!props.inline && (
          <div
            className={`close-modal-button chat ${props.type}`}
            onClick={() =>
              messages.length < 1
                ? setOpen(false)
                : isDoneReading
                  ? clearConversation()
                  : stopGeneratingMessage()
            }
          >
            <svg
              className="close-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>
              {messages.length < 1 ? "Close" : isDoneReading ? "Clear" : "Stop"}{" "}
            </span>
          </div>
        )}
        <div
          className={`system-information-wrapper${
            currentGroup ? " with-group" : ""
          } ${
            !props.inline && props.type === "ecommerce" && messages.length > 1
              ? "tv-pt-8"
              : ""
          }`}
        >
          <div
            onScroll={handleScroll}
            ref={scrollRef}
            className="chat-modal-wrapper tv-relative tv-overflow-auto sm:tv-max-h-[calc(60vh)] tv-max-h-[85vh] tv-flex tv-flex-col tv-gap-1 tv-mt-1"
          >
            <AnimatePresence mode="wait">
              <div className="ai-message initial-message">
                {!messages.length ? <SuggestedQuestions /> : null}
              </div>
              {messages.map((message, i) => (
                <ChatMessage key={`${i}-message`} idx={i} message={message} />
              ))}
            </AnimatePresence>
          </div>
          <div className="tv-h-[40px] tv-blur-md tv-translate-y-6 tv-absolute tv-left-3 tv-right-3 tv-bottom-0 tv-bg-gradient-to-t tv-from-neutral-300 tv-to-transparent"></div>
          <div className="tv-h-[50px] tv-blur-lg tv-translate-y-8 tv-absolute tv-left-24 tv-right-24 tv-bottom-0 tv-bg-gradient-to-t tv-from-neutral-300 tv-to-transparent"></div>
        </div>
      </div>
      <div
        className={`chat-footer-wrapper${
          messages.length ? " with-messages" : ""
        }`}
      >
        <div className="inline:tv-ml-2 inline:tv-mb-1">
          <ImagePreview isUploading={uploadingImage} imageUrl={imageUrl} active />
        </div>
        {currentGroup && (
          <div
            className={`chat-group-disclaimer ${
              props.inline ? "!tv-hidden" : ""
            }`}
          >
            <div>Chatting with {currentGroup.name.replace(/<[^>]*>/g, "")}</div>
            <button
              onClick={() => {
                cancelGroupChat();
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        <div
          className={`input-wrapper chat ${
            props.type == "ecommerce" ? "" : props.type
          } ${props.inline && "inline-input-wrapper"}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentQuestion || imageUrl !== "") {
                askQuestion(currentQuestion);
              }
            }}
          >
            <input
              ref={chatInput}
              value={currentQuestion}
              className={`${props.inline ? "inline-input" : ""}`}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Ask anything ..."
            />
          </form>
          <button
            onClick={() => {
              if (currentQuestion || imageUrl !== "") {
                askQuestion(currentQuestion);
              }
            }}
            className="inline-submit-icon"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
          <UploadAudio />
          <UploadImage />
        </div>
        <div className={`trieve-footer chat ${props.type}`}>
          <div className="tags-row">
            {props.tags?.length ? <Tags /> : null}
            <div className="tags-spacer"></div>
            <a
              className="trieve-powered text-right"
              href="https://trieve.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn.trieve.ai/trieve-logo.png"
                alt="logo"
                className="inline-block mr-2"
              />
              Powered by Trieve
            </a>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default ChatMode;
