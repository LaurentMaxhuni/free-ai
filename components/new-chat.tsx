import React from 'react'
import AI_Prompt from './kokonutui/ai-prompt'

type NewChatProps = {
  onSend?: (value: string, model: string, label: string) => void;
};

const NewChat = ({ onSend }: NewChatProps) => {
  return (
    <div className='flex items-center justify-center h-full flex-col mx-auto w-full max-w-3xl px-6'>
      <h1 className='text-3xl font-bold'>What would you like to ask me?</h1>
      <AI_Prompt onSend={onSend} />
    </div>
  )
}

export default NewChat
