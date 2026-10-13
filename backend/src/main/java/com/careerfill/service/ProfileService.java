package com.careerfill.service;

import com.careerfill.dto.ProfileDto;
import com.careerfill.entity.*;
import com.careerfill.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final EducationRepository educationRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final ExperienceRepository experienceRepository;

    public ProfileService(UserRepository userRepository,
                          ProfileRepository profileRepository,
                          EducationRepository educationRepository,
                          SkillRepository skillRepository,
                          ProjectRepository projectRepository,
                          ExperienceRepository experienceRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.educationRepository = educationRepository;
        this.skillRepository = skillRepository;
        this.projectRepository = projectRepository;
        this.experienceRepository = experienceRepository;
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Profile profile = profileRepository.findByUser(user)
                .orElseGet(() -> {
                    Profile p = new Profile();
                    p.setUser(user);
                    return p;
                });

        ProfileDto dto = new ProfileDto();
        dto.setEmail(user.getEmail());
        dto.setFullName(profile.getFullName());
        if (profile.getFullName() != null && !profile.getFullName().trim().isEmpty()) {
            String[] parts = profile.getFullName().trim().split("\\s+");
            dto.setFirstName(parts[0]);
            if (parts.length > 1) {
                dto.setLastName(profile.getFullName().trim().substring(parts[0].length()).trim());
            }
        }
        dto.setPhone(profile.getPhone());
        dto.setDob(profile.getDob());
        dto.setAddress(profile.getAddress());
        dto.setSummary(profile.getSummary());
        dto.setLinkedinUrl(profile.getLinkedinUrl());
        dto.setGithubUrl(profile.getGithubUrl());
        dto.setPortfolioUrl(profile.getPortfolioUrl());

        // Map Education
        List<Education> eduList = educationRepository.findByUser(user);
        List<ProfileDto.EducationDto> eduDtos = eduList.stream().map(e -> {
            ProfileDto.EducationDto ed = new ProfileDto.EducationDto();
            ed.setCollege(e.getCollege());
            ed.setUniversity(e.getUniversity());
            ed.setDegree(e.getDegree());
            ed.setFieldOfStudy(e.getFieldOfStudy());
            ed.setBranch(e.getBranch());
            ed.setCgpa(e.getCgpa());
            ed.setGraduationYear(e.getGraduationYear());
            return ed;
        }).collect(Collectors.toList());
        dto.setEducation(eduDtos);

        // Map Skills
        List<Skill> skillList = skillRepository.findByUser(user);
        dto.setSkills(skillList.stream().map(Skill::getSkillName).collect(Collectors.toList()));

        // Map Projects
        List<Project> projList = projectRepository.findByUser(user);
        List<ProfileDto.ProjectDto> projDtos = projList.stream().map(p -> {
            ProfileDto.ProjectDto pd = new ProfileDto.ProjectDto();
            pd.setName(p.getName());
            pd.setDescription(p.getDescription());
            pd.setTechnologies(p.getTechnologies());
            pd.setGithubUrl(p.getGithubUrl());
            return pd;
        }).collect(Collectors.toList());
        dto.setProjects(projDtos);

        // Map Experience
        List<Experience> expList = experienceRepository.findByUser(user);
        List<ProfileDto.ExperienceDto> expDtos = expList.stream().map(ex -> {
            ProfileDto.ExperienceDto exd = new ProfileDto.ExperienceDto();
            exd.setCompany(ex.getCompany());
            exd.setRole(ex.getRole());
            exd.setStartDate(ex.getStartDate());
            exd.setEndDate(ex.getEndDate());
            exd.setDescription(ex.getDescription());
            return exd;
        }).collect(Collectors.toList());
        dto.setExperience(expDtos);

        return dto;
    }

    @Transactional
    public ProfileDto updateProfile(String email, ProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Profile profile = profileRepository.findByUser(user)
                .orElseGet(() -> {
                    Profile p = new Profile();
                    p.setUser(user);
                    return p;
                });

        if (dto.getFullName() != null) {
            profile.setFullName(dto.getFullName());
        } else if (dto.getFirstName() != null || dto.getLastName() != null) {
            String combined = ((dto.getFirstName() != null ? dto.getFirstName() : "") + " " +
                               (dto.getLastName() != null ? dto.getLastName() : "")).trim();
            profile.setFullName(combined);
        }
        if (dto.getPhone() != null) profile.setPhone(dto.getPhone());
        if (dto.getDob() != null) profile.setDob(dto.getDob());
        if (dto.getAddress() != null) profile.setAddress(dto.getAddress());
        if (dto.getSummary() != null) profile.setSummary(dto.getSummary());
        if (dto.getLinkedinUrl() != null) profile.setLinkedinUrl(dto.getLinkedinUrl());
        if (dto.getGithubUrl() != null) profile.setGithubUrl(dto.getGithubUrl());
        if (dto.getPortfolioUrl() != null) profile.setPortfolioUrl(dto.getPortfolioUrl());

        profileRepository.save(profile);

        // Update Education if provided
        if (dto.getEducation() != null) {
            List<Education> currentEdu = educationRepository.findByUser(user);
            educationRepository.deleteAll(currentEdu);

            List<Education> newEduList = new ArrayList<>();
            for (ProfileDto.EducationDto ed : dto.getEducation()) {
                Education edu = new Education();
                edu.setUser(user);
                edu.setCollege(ed.getCollege());
                edu.setUniversity(ed.getUniversity());
                edu.setDegree(ed.getDegree());
                edu.setFieldOfStudy(ed.getFieldOfStudy());
                edu.setBranch(ed.getBranch());
                edu.setCgpa(ed.getCgpa());
                edu.setGraduationYear(ed.getGraduationYear());
                newEduList.add(edu);
            }
            educationRepository.saveAll(newEduList);
        }

        // Update Skills if provided
        if (dto.getSkills() != null) {
            List<Skill> currentSkills = skillRepository.findByUser(user);
            skillRepository.deleteAll(currentSkills);

            List<Skill> newSkills = dto.getSkills().stream()
                    .filter(s -> s != null && !s.trim().isEmpty())
                    .map(s -> new Skill(user, s.trim()))
                    .collect(Collectors.toList());
            skillRepository.saveAll(newSkills);
        }

        // Update Projects if provided
        if (dto.getProjects() != null) {
            List<Project> currentProjects = projectRepository.findByUser(user);
            projectRepository.deleteAll(currentProjects);

            List<Project> newProjects = new ArrayList<>();
            for (ProfileDto.ProjectDto pd : dto.getProjects()) {
                Project proj = new Project();
                proj.setUser(user);
                proj.setName(pd.getName());
                proj.setDescription(pd.getDescription());
                proj.setTechnologies(pd.getTechnologies());
                proj.setGithubUrl(pd.getGithubUrl());
                newProjects.add(proj);
            }
            projectRepository.saveAll(newProjects);
        }

        // Update Experience if provided
        if (dto.getExperience() != null) {
            List<Experience> currentExp = experienceRepository.findByUser(user);
            experienceRepository.deleteAll(currentExp);

            List<Experience> newExpList = new ArrayList<>();
            for (ProfileDto.ExperienceDto exd : dto.getExperience()) {
                Experience exp = new Experience();
                exp.setUser(user);
                exp.setCompany(exd.getCompany());
                exp.setRole(exd.getRole());
                exp.setStartDate(exd.getStartDate());
                exp.setEndDate(exd.getEndDate());
                exp.setDescription(exd.getDescription());
                newExpList.add(exp);
            }
            experienceRepository.saveAll(newExpList);
        }

        return getProfile(email);
    }
}
