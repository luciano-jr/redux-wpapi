import { REDUX_WP_API_REQUEST } from '../../src/constants/actions';

export default {
  type: REDUX_WP_API_REQUEST,
  payload: {
    uid: '/namespace/any',
    page: 1,
  },
  meta: {
    name: 'test',
    aggregator: 'any',
    requestAt: Date.now(),
    operation: 'get',
  },
};