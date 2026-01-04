import React from 'react'
import AI_Prompt from './kokonutui/ai-prompt'

const NewChat = () => {
  return (
    <div className='flex items-center justify-center h-full flex-col'>
      <h1 className='text-3xl font-bold'>What would you like to ask me?</h1>
      <AI_Prompt />
    </div>
  )
}

export default NewChat