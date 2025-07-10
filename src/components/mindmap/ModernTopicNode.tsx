import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Topic } from '@/types/quiz'; // Corrected import path

interface ModernTopicNodeProps {
  data: {
    label: string;
    topic: Topic;
    onTopicClick: (topic: Topic) => void;
  };
}

const gradients = [
  'transparent linear-gradient(284deg, #856DEA 0%, #00D6F6 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #4C78EF 0%, #00F1C3 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #FF2FC7 0%, #4CB0EF 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #10CC53 0%, #4CBDEF 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #FF1994 0%, #856DEA 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #190548 0%, #4C78EF 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #00F1C3 0%, #10CC53 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #00D6F6 0%, #FF2FC7 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #4CB0EF 0%, #FF1994 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #4CBDEF 0%, #160644 100%) 0% 0% no-repeat padding-box',
];

/**
 * Creates a numeric hash from a string.
 * This is a simple, non-cryptographic hash function to convert a string ID (like a UUID)
 * into a number that can be used for style selection.
 * @param str The string to hash.
 * @returns A number representing the hash.
 */
const stringToNumericHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const ModernTopicNode = ({ data }: ModernTopicNodeProps) => {
  const { label, topic, onTopicClick } = data;

  // Use a hash of the topic ID string to cycle through the gradients
  const numericId = stringToNumericHash(topic.id);
  const gradient = gradients[numericId % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg shadow-lg overflow-hidden cursor-pointer flex items-center justify-center text-white"
      style={{
        width: '361px',
        height: '160px',
        background: gradient,
      }}
      onClick={() => onTopicClick(topic)}
    >
      <div className="p-5 text-center">
        <h3 className="text-2xl font-bold">{label}</h3>
        {topic.description && (
          <p className="text-base mt-2">{topic.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-transparent" style={{border: 'none'}} />
      <Handle type="target" position={Position.Left} className="!bg-transparent" style={{border: 'none'}} />
    </motion.div>
  );
};

export default memo(ModernTopicNode);