import { Types } from 'mongoose';
import logger from '~/config/winston';
import type * as t from '~/types';

/**
 * Formats a date in YYYY-MM-DD format
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Factory function that takes mongoose instance and returns the methods
export function createMemoryMethods(mongoose: typeof import('mongoose')) {
  /**
   * Creates a new memory entry for a user
   * Throws an error if a memory with the same key already exists
   */
  async function createMemory({
    userId,
    key,
    value,
    tokenCount = 0,
  }: t.SetMemoryParams): Promise<t.MemoryResult> {
    try {
      logger.debug(`[MEMORY] beforeSave(create) user=${userId} key=${key} tokens=${tokenCount}`);
      logger.debug(`[MEMORY] value preview: ${String(value).slice(0, 200)}${
        String(value).length > 200 ? '…' : ''
      }`);
      if (key?.toLowerCase() === 'nothing') {
        return { ok: false };
      }

      const MemoryEntry = mongoose.models.MemoryEntry;
      const existingMemory = await MemoryEntry.findOne({ userId, key });
      if (existingMemory) {
        throw new Error('Memory with this key already exists');
      }

      await MemoryEntry.create({
        userId,
        key,
        value,
        tokenCount,
        updated_at: new Date(),
      });

      logger.debug(`[MEMORY] afterSave(create) success user=${userId} key=${key}`);
      return { ok: true };
    } catch (error) {
      logger.error(`[MEMORY] afterSave(create) failed user=${userId} key=${key}:`, error);
      throw new Error(
        `Failed to create memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Sets or updates a memory entry for a user
   */
  async function setMemory({
    userId,
    key,
    value,
    tokenCount = 0,
  }: t.SetMemoryParams): Promise<t.MemoryResult> {
    try {
      logger.debug(`[MEMORY] beforeSave(set) user=${userId} key=${key} tokens=${tokenCount}`);
      logger.debug(`[MEMORY] value preview: ${String(value).slice(0, 200)}${
        String(value).length > 200 ? '…' : ''
      }`);
      if (key?.toLowerCase() === 'nothing') {
        return { ok: false };
      }

      const MemoryEntry = mongoose.models.MemoryEntry;
      await MemoryEntry.findOneAndUpdate(
        { userId, key },
        {
          value,
          tokenCount,
          updated_at: new Date(),
        },
        {
          upsert: true,
          new: true,
        },
      );

      logger.debug(`[MEMORY] afterSave(set) success user=${userId} key=${key}`);
      return { ok: true };
    } catch (error) {
      logger.error(`[MEMORY] afterSave(set) failed user=${userId} key=${key}:`, error);
      throw new Error(
        `Failed to set memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Deletes a specific memory entry for a user
   */
  async function deleteMemory({ userId, key }: t.DeleteMemoryParams): Promise<t.MemoryResult> {
    try {
      logger.debug(`[MEMORY] delete user=${userId} key=${key}`);
      const MemoryEntry = mongoose.models.MemoryEntry;
      const result = await MemoryEntry.findOneAndDelete({ userId, key });
      const ok = !!result;
      logger.debug(`[MEMORY] delete ${ok ? 'successful' : 'failed'} user=${userId} key=${key}`);
      return { ok };
    } catch (error) {
      logger.error(`[MEMORY] delete failed user=${userId} key=${key}:`, error);
      throw new Error(
        `Failed to delete memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Gets all memory entries for a user
   */
  async function getAllUserMemories(
    userId: string | Types.ObjectId,
  ): Promise<t.IMemoryEntryLean[]> {
    try {
      logger.debug(`[MEMORY] onRetrieve(all) user=${userId}`);
      const MemoryEntry = mongoose.models.MemoryEntry;
      const docs = (await MemoryEntry.find({ userId }).lean()) as t.IMemoryEntryLean[];
      logger.debug(`[MEMORY] onRetrieve(all) count=${docs?.length ?? 0} user=${userId}`);
      return docs;
    } catch (error) {
      throw new Error(
        `Failed to get all memories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Gets and formats all memories for a user in two different formats
   */
  async function getFormattedMemories({
    userId,
  }: t.GetFormattedMemoriesParams): Promise<t.FormattedMemoriesResult> {
    try {
      const memories = await getAllUserMemories(userId);
      logger.debug(`[MEMORY] getFormattedMemories user=${userId} count=${memories.length}`);

      if (!memories || memories.length === 0) {
        return { withKeys: '', withoutKeys: '', totalTokens: 0 };
      }

      const sortedMemories = memories.sort(
        (a, b) => new Date(a.updated_at!).getTime() - new Date(b.updated_at!).getTime(),
      );

      const totalTokens = sortedMemories.reduce((sum, memory) => {
        return sum + (memory.tokenCount || 0);
      }, 0);

      const withKeys = sortedMemories
        .map((memory, index) => {
          const date = formatDate(new Date(memory.updated_at!));
          const tokenInfo = memory.tokenCount ? ` [${memory.tokenCount} tokens]` : '';
          return `${index + 1}. [${date}]. ["key": "${memory.key}"]${tokenInfo}. ["value": "${memory.value}"]`;
        })
        .join('\n\n');

      const withoutKeys = sortedMemories
        .map((memory, index) => {
          const date = formatDate(new Date(memory.updated_at!));
          return `${index + 1}. [${date}]. ${memory.value}`;
        })
        .join('\n\n');

      return { withKeys, withoutKeys, totalTokens };
    } catch (error) {
      logger.error('Failed to get formatted memories:', error);
      return { withKeys: '', withoutKeys: '', totalTokens: 0 };
    }
  }

  return {
    setMemory,
    createMemory,
    deleteMemory,
    getAllUserMemories,
    getFormattedMemories,
  };
}

export type MemoryMethods = ReturnType<typeof createMemoryMethods>;
