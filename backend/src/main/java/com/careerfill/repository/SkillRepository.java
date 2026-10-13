package com.careerfill.repository;

import com.careerfill.entity.Skill;
import com.careerfill.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findByUser(User user);
    List<Skill> findByUserId(Long userId);
    void deleteByUser(User user);
}
