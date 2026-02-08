// Mock Directus SDK modules for testing
jest.mock('@directus/extensions-sdk', () => ({
  useApi: jest.fn(() => ({
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
  })),
  useStores: jest.fn(() => ({
    useUserStore: jest.fn(() => ({
      currentUser: { id: 1, name: 'Test User' }
    })),
    useRelationsStore: jest.fn(() => ({
      getRelationsForCollection: jest.fn(() => [])
    }))
  })),
  useCollection: jest.fn(() => ({
    defaults: {}
  }))
}));

// Mock Vue composables
jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  inject: jest.fn(() => ({})),
  toRefs: jest.fn((obj) => obj)
}));

// Mock vue-i18n
jest.mock('vue-i18n', () => ({
  useI18n: jest.fn(() => ({
    t: jest.fn((key) => key)
  }))
}));