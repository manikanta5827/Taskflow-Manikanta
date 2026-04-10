import { logger } from '../config/logger.js';

export const emailService = {
  async sendTaskAssigned(email: string, taskTitle: string) {
    logger.info('Email notification', {
      to: email,
      subject: 'Task Assigned',
      actionType: 'task.assigned',
      taskTitle,
    });
  },

  async sendStatusChanged(email: string, taskTitle: string, status: string) {
    logger.info('Email notification', {
      to: email,
      subject: 'Task Status Changed',
      actionType: 'task.status.changed',
      taskTitle,
      status,
    });
  },
};
