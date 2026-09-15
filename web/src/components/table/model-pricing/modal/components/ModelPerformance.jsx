/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at an option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { Avatar, Typography, Table, Empty } from '@douyinfe/semi-ui';
import { IconActivity, IconClock, IconCheckCircleStroked } from '@douyinfe/semi-icons';

const { Text } = Typography;

// 性能页：按照用户提供的结构渲染
// 目前后端暂无模型级 TPS / 首 Token 延迟 / 成功率 等统计，这里展示 UI + 占位数据/空状态
const ModelPerformance = ({ modelData, t }) => {
  // 示例数据（与用户描述一致的占位）
  const overall = {
    tps: '-',
    firstTokenLatency: '-',
    avgLatency: '2.49s',
    successRate: '0.00%',
  };

  // 分组性能示例数据
  const groupPerfColumns = [
    { title: t('分组'), dataIndex: 'group', key: 'group', width: 120 },
    { title: 'TPS', dataIndex: 'tps', key: 'tps', width: 100, align: 'center' },
    {
      title: t('平均首 Token 延迟'),
      dataIndex: 'firstToken',
      key: 'firstToken',
      width: 160,
      align: 'center',
    },
    {
      title: t('平均延迟'),
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      width: 120,
      align: 'center',
    },
    {
      title: t('成功率'),
      dataIndex: 'successRate',
      key: 'successRate',
      width: 100,
      align: 'center',
    },
  ];

  const groupPerfData = [
    {
      key: 'default',
      group: '-',
      tps: '-',
      firstToken: '2.49s',
      avgLatency: '-',
      successRate: '0.00%',
    },
  ];

  return (
    <div>
      {/* 标题区 */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='cyan' className='mr-2 shadow-md'>
          <IconActivity size={16} />
        </Avatar>
        <div>
          <Text className='text-lg font-medium'>{t('性能')}</Text>
          <div className='text-xs text-gray-600'>
            {t('模型性能指标与分组表现')}
          </div>
        </div>
      </div>

      {/* 总体指标 */}
      <div className='mb-6'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <div className='p-3 rounded-lg border' style={{ borderColor: 'var(--semi-color-border)' }}>
            <div className='text-xs text-gray-500 mb-1'>TPS</div>
            <div className='text-2xl font-semibold'>{overall.tps}</div>
            <div className='text-xs text-gray-500 mt-0.5'>{t('持续每秒 Token 数')}</div>
          </div>

          <div className='p-3 rounded-lg border' style={{ borderColor: 'var(--semi-color-border)' }}>
            <div className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
              <IconClock size={14} />
              {t('平均首 Token 延迟')}
            </div>
            <div className='text-2xl font-semibold'>{overall.firstTokenLatency}</div>
          </div>

          <div className='p-3 rounded-lg border' style={{ borderColor: 'var(--semi-color-border)' }}>
            <div className='text-xs text-gray-500 mb-1'>{t('平均延迟')}</div>
            <div className='text-2xl font-semibold'>{overall.avgLatency}</div>
          </div>

          <div className='p-3 rounded-lg border' style={{ borderColor: 'var(--semi-color-border)' }}>
            <div className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
              <IconCheckCircleStroked size={14} />
              {t('成功率')}
            </div>
            <div className='text-2xl font-semibold'>{overall.successRate}</div>
          </div>
        </div>
      </div>

      {/* 最近 24 小时请求成功率采样 */}
      <div className='mb-6'>
        <div className='text-sm font-medium mb-2'>{t('最近 24 小时请求成功率采样')}</div>
        <div className='text-xs text-gray-500 mb-2'>{t('可用性（最近 24 小时）')}</div>
        <div className='p-4 rounded-lg border bg-gray-50' style={{ borderColor: 'var(--semi-color-border)' }}>
          <Empty
            image={<div style={{ fontSize: 28, opacity: 0.6 }}>📈</div>}
            title={t('暂无数据')}
            description={t('最近 24 小时请求成功率采样')}
          />
        </div>
      </div>

      {/* 各分组性能 */}
      <div className='mb-6'>
        <div className='text-sm font-medium mb-2'>{t('各分组性能')}</div>
        <div className='text-xs text-gray-500 mb-2'>
          {t('平均延迟、首 Token 延迟、TPS 和成功率')}
        </div>

        <Table
          columns={groupPerfColumns}
          dataSource={groupPerfData}
          pagination={false}
          size='small'
          bordered
          empty={<Empty title={t('暂无数据')} />}
        />
      </div>

      {/* 延迟趋势 */}
      <div className='mb-2'>
        <div className='text-sm font-medium mb-2'>{t('延迟趋势（最近 24 小时）')}</div>
        <div className='text-xs text-gray-500 mb-2'>{t('平均首 Token 延迟')}</div>
        <div className='p-4 rounded-lg border bg-gray-50' style={{ borderColor: 'var(--semi-color-border)' }}>
          <Empty
            image={<div style={{ fontSize: 28, opacity: 0.6 }}>📉</div>}
            title={t('暂无数据')}
            description={t('平均首 Token 延迟')}
          />
        </div>
      </div>
    </div>
  );
};

export default ModelPerformance;
