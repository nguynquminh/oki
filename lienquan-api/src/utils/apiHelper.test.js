const { searchSkillInBadges } = require('./apiHelper');

describe('searchSkillInBadges', () => {
    const mockBadges = [
        {
            id: 1,
            name: 'Thành khởi nguyên',
            description: ['Thích hợp: Tất cả các dạng tướng'],
            groups: [
                {
                    group_id: 'group1',
                    skills: [
                        { name: 'Quả cầu băng sương' },
                        { name: 'Siêu hồi máu' }
                    ]
                },
                {
                    group_id: 'group2',
                    skills: [
                        { name: 'Uy áp' }
                    ]
                }
            ]
        },
        {
            id: 2,
            name: 'Vực hỗn loạn',
            description: ['Thích hợp: Đấu sĩ/Sát thủ'],
            groups: [
                {
                    group_id: 'group1',
                    skills: [
                        { name: 'Ma tính' },
                        { name: 'Dư ảnh' }
                    ]
                }
            ]
        }
    ];

    test('should return null when skillName is empty or null', () => {
        expect(searchSkillInBadges(mockBadges, '')).toBeNull();
        expect(searchSkillInBadges(mockBadges, null)).toBeNull();
    });

    test('should return null when no match is found', () => {
        expect(searchSkillInBadges(mockBadges, 'NonExistentSkill')).toBeNull();
    });

    test('should find a skill with exact match (case-insensitive)', () => {
        const result = searchSkillInBadges(mockBadges, 'Quả cầu băng sương');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
        expect(result[0].groups).toHaveLength(1);
        expect(result[0].groups[0].group_id).toBe('group1');
        expect(result[0].groups[0].skills[0].name).toBe('Quả cầu băng sương');
    });

    test('should find a skill with partial match', () => {
        const result = searchSkillInBadges(mockBadges, 'băng sương');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Thành khởi nguyên');
        expect(result[0].groups[0].skills[0].name).toBe('Quả cầu băng sương');
    });

    test('should be case-insensitive', () => {
        const result = searchSkillInBadges(mockBadges, 'QUẢ CẦU');
        expect(result).not.toBeNull();
        expect(result[0].groups[0].skills[0].name).toBe('Quả cầu băng sương');
    });

    test('should return multiple matches across badges and groups', () => {
        // Adding a common word 'a' to some skills for this test
        const multiMatchBadges = [
            ...mockBadges,
            {
                id: 3,
                name: 'Test Badge',
                description: ['Test'],
                groups: [
                    {
                        group_id: 'group1',
                        skills: [{ name: 'Ma pháp' }]
                    }
                ]
            }
        ];

        const result = searchSkillInBadges(multiMatchBadges, 'Ma');
        // 'Ma tính' in id: 2 and 'Ma pháp' in id: 3
        expect(result).toHaveLength(2);
        expect(result.map(b => b.id)).toContain(2);
        expect(result.map(b => b.id)).toContain(3);
    });

    test('should return multiple groups if multiple groups match in one badge', () => {
        const multiGroupBadges = [
            {
                id: 4,
                name: 'Multi Group Badge',
                groups: [
                    {
                        group_id: 'g1',
                        skills: [{ name: 'SearchMe 1' }]
                    },
                    {
                        group_id: 'g2',
                        skills: [{ name: 'SearchMe 2' }]
                    }
                ]
            }
        ];

        const result = searchSkillInBadges(multiGroupBadges, 'SearchMe');
        expect(result).toHaveLength(1);
        expect(result[0].groups).toHaveLength(2);
        expect(result[0].groups[0].group_id).toBe('g1');
        expect(result[0].groups[1].group_id).toBe('g2');
    });

    test('should maintain structure integrity', () => {
        const result = searchSkillInBadges(mockBadges, 'Uy áp');
        const badge = result[0];
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('description');
        expect(badge).toHaveProperty('groups');
        expect(Array.isArray(badge.groups)).toBe(true);
        expect(badge.groups[0]).toHaveProperty('group_id');
        expect(badge.groups[0]).toHaveProperty('skills');
        expect(Array.isArray(badge.groups[0].skills)).toBe(true);
    });
});
