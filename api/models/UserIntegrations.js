const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  isConnected: {
    type: Boolean,
    default: false,
  },
  lastValidated: {
    type: Date,
  },
  lastError: {
    type: String,
  },
  metadata: {
    type: Map,
    of: String,
  },
});

const userIntegrationsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    integrations: {
      gohighlevel: {
        type: integrationSchema,
        default: () => ({}),
      },
      // Future integrations can be added here
      // slack: integrationSchema,
      // notion: integrationSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
userIntegrationsSchema.index({ userId: 1, 'integrations.gohighlevel.isConnected': 1 });

// Static methods
userIntegrationsSchema.statics.getIntegrationStatus = async function (userId, integration) {
  const userIntegration = await this.findOne({ userId });
  if (!userIntegration || !userIntegration.integrations[integration]) {
    return { isConnected: false };
  }
  return userIntegration.integrations[integration];
};

userIntegrationsSchema.statics.updateIntegrationStatus = async function (
  userId,
  integration,
  status
) {
  return this.findOneAndUpdate(
    { userId },
    {
      $set: {
        [`integrations.${integration}`]: status,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
};

module.exports = mongoose.model('UserIntegrations', userIntegrationsSchema);